import { ReactionNo } from './rxn.js';

import { css, formatDateTime, hideModal, svg } from './utils.js';

import { NotificationSeverity } from './enums.js';

/**
 * @typedef {Object} ReferralOffer
 * @property {number} PercentOff
 * @property {number} MonthsOff
 * @property {number} PercentCommission
 * @property {number} MaxRedemptions
 * @property {string} OfferEnds
 * @property {string} OfferText
 * @property {string} OfferURL
 */

/**
 * @typedef {Object} ReferralCode
 * @property {string} ReferralCode
 * @property {string} ReferralLink
 * @property {number} PercentOff
 * @property {number} MonthsOff
 * @property {number} PercentCommission
 * @property {number} Redemptions
 * @property {number} MaxRedemptions
 */

export class Referrals {
  /** @type {import('./client.js').AIPRMClient} */
  client = {};

  /** @type {import('./config.js').ReferralsConfig} */
  config = {};

  showNotification = () => {};

  /**
   * @param {import('./client.js').AIPRMClient} client
   * @param {import('./config.js').ReferralsConfig} config
   * @param {function} showNotification
   */
  constructor(client, config, showNotification) {
    this.client = client;
    this.config = config;
    this.showNotification = showNotification;
  }

  /**
   * @param {Element} afterElement
   */
  addSidebarButton(afterElement) {
    if (this.client.UserQuota.hasReferralsFeatureEnabled()) {
      const button = document.createElement('a');
      button.id = 'referral-button';
      button.className = css`ExportButton`;
      button.innerHTML = /*html*/ `${svg`Referral`} ${this.config.Title} ${
        this.config.NewFeatureBadge
      }`;
      button.onclick = this.show.bind(this);

      afterElement.after(button);
    }
  }

  async show() {
    let offer = null;
    let reactionNo = null;

    if (!this.client.UserQuota.canUseReferrals()) {
      return;
    }

    try {
      offer = await this.client.fetchReferralOffer();
    } catch (error) {
      reactionNo = error.ReactionNo;

      if (
        !reactionNo ||
        (reactionNo !== ReactionNo.RXN_AIPRM_REFERRALS_NO_OFFER &&
          reactionNo !== ReactionNo.RXN_AIPRM_REFERRALS_MAX_REDEMPTIONS)
      ) {
        this.showNotification(
          NotificationSeverity.ERROR,
          `Could not fetch referral offer. Please try again later.`
        );
        return;
      }
    }

    let referralModal = document.getElementById('referralModal');

    // if modal does not exist, create it, add event listener on submit and append it to body
    if (!referralModal) {
      referralModal = document.createElement('div');
      referralModal.id = 'referralModal';
      document.body.appendChild(referralModal);
    }

    referralModal.innerHTML = /*html*/ `
        <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__text-center AIPRM__transition-opacity AIPRM__z-50">
            <div class="AIPRM__absolute AIPRM__bg-black/50 dark:AIPRM__bg-black/80 AIPRM__inset-0">
            </div>

            <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__overflow-y-auto">
                <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__text-center AIPRM__transition-opacity AIPRM__z-50">
                    <div class="AIPRM__flex AIPRM__items-center AIPRM__justify-center AIPRM__min-h-full">
                        <div
                            class="AIPRM__align-center AIPRM__bg-white dark:AIPRM__bg-gray-900 dark:AIPRM__text-gray-200 AIPRM__inline-block AIPRM__overflow-hidden sm:AIPRM__rounded-lg AIPRM__shadow-xl sm:AIPRM__align-middle sm:AIPRM__max-w-lg sm:AIPRM__my-8 sm:AIPRM__w-full AIPRM__text-left AIPRM__transform AIPRM__transition-all"
                            role="dialog" aria-modal="true" aria-labelledby="modal-headline">

                            <div class="AIPRM__bg-white dark:AIPRM__bg-gray-900 AIPRM__px-4 AIPRM__pt-5 AIPRM__pb-4 sm:AIPRM__p-6 sm:AIPRM__pb-4">

                                <h3 class="AIPRM__m-0 AIPRM__text-gray-900 dark:AIPRM__text-gray-100 AIPRM__text-xl AIPRM__border-b AIPRM__border-gray-200 dark:AIPRM__border-gray-700 AIPRM__my-4">${
                                  this.config.Title
                                }</h3>

                                <div>
                                    ${
                                      reactionNo
                                        ? this.showReferralReactionNo(
                                            reactionNo
                                          )
                                        : this.showReferralOffer(offer)
                                    }
                                </div>
                            </div>

                            <div class="AIPRM__bg-gray-200 dark:AIPRM__bg-gray-850 AIPRM__px-4 AIPRM__py-3 AIPRM__text-right">
                                <button type="button" class="AIPRM__bg-gray-600 hover:AIPRM__bg-gray-800 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white"
                                        onclick="AIPRM.hideModal('referralModal')"> Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

    referralModal.style = 'display: block;';

    // add event listener to close the modal on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideModal('referralModal');
      }
    });
  }

  /**
   * @param {number} reactionNo
   */
  showReferralReactionNo(reactionNo) {
    let infoText = '';
    if (reactionNo === ReactionNo.RXN_AIPRM_REFERRALS_NO_OFFER) {
      infoText = this.config.NoOffer;
    } else if (reactionNo === ReactionNo.RXN_AIPRM_REFERRALS_MAX_REDEMPTIONS) {
      infoText = this.config.MaxRedemptions;
    } else {
      infoText = `Could not fetch referral offer. Please try again later.`;
    }

    return infoText;
  }

  /**
   * @param {ReferralOffer} offer
   */
  showReferralOffer(offer) {
    return /*html*/ `
        <div class="AIPRM__my-4 AIPRM__flex AIPRM__justify-center">${svg`ReferralHuge`}</div>
        
        <div>
            ${offer.OfferText}
        </div>

        <div class="AIPRM__text-sm AIPRM__mt-4 AIPRM__text-gray-500 AIPRM__text-right">
            Offer ends: ${formatDateTime(offer.OfferEnds)}
        </div>

        <div id="referralModal-code-wrapper" class="AIPRM__mt-4">
            <button type="button" class="AIPRM__w-full AIPRM__bg-green-600 hover:AIPRM__bg-green-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white"  
                    onclick="AIPRM.Referrals.showReferralCode();">
                View your promotion code
            </button>
        </div>
    `;
  }

  async showReferralCode() {
    let referralCode = null;
    let reactionNo = null;

    if (!this.client.UserQuota.canUseReferrals()) {
      return;
    }

    try {
      referralCode = await this.client.fetchReferralCode();
    } catch (error) {
      reactionNo = error.ReactionNo;

      if (
        reactionNo &&
        reactionNo !== ReactionNo.RXN_AIPRM_REFERRALS_NO_OFFER &&
        reactionNo !== ReactionNo.RXN_AIPRM_REFERRALS_MAX_REDEMPTIONS
      ) {
        throw error;
      }
    }

    let referralCodeWrapper = document.getElementById(
      'referralModal-code-wrapper'
    );

    referralCodeWrapper.innerHTML = /* html */ `
        <div class="AIPRM__border-t AIPRM__border-gray-200 dark:AIPRM__border-gray-700">
            <div class="AIPRM__mt-4">
              Your personal promotion code:&nbsp;
              <span class="AIPRM__text-2xl AIPRM__font-bold">
                  ${referralCode.ReferralCode}
              </span>
            </div>
            
            <div class="AIPRM__flex AIPRM__grid-cols-2 AIPRM__mt-4">
              <button type="button"
                  onclick="AIPRM.Referrals.copyReferralCode('${referralCode.ReferralCode}', false);"
                  title="Copy your personal promotion code to clipboard"
                  class="AIPRM__w-full AIPRM__bg-green-600 hover:AIPRM__bg-green-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white">
                  Copy code
              </button>
              <button type="button"
                  onclick="AIPRM.Referrals.copyReferralCode('${referralCode.ReferralLink}', true);"
                  title="Copy your invite link to clipboard"
                  class="AIPRM__w-full AIPRM__bg-green-600 hover:AIPRM__bg-green-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white">
                  Copy invite link
              </button>
            </div>
        </div>

    `;
  }

  async copyReferralCode(text, isLink) {
    navigator.clipboard.writeText(text).then(
      // successfully copied
      () => {
        this.showNotification(
          NotificationSeverity.SUCCESS,
          isLink
            ? 'The invite link with your personal promotion code was copied to your clipboard.'
            : 'Your personal promotion code was copied to your clipboard.'
        );
      },
      // error - something went wrong (permissions?)
      () => {
        this.showNotification(
          NotificationSeverity.ERROR,
          'Something went wrong. Please try again.'
        );
      }
    );
  }
}
