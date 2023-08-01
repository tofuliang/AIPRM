import { AppSignupURL, AppPricingURL, QuotaMessagesURL } from './config.js';
import {
  PlanLevelNo,
  PromptTypeNo,
  ListTypeNo,
  FeatureBitset,
} from './enums.js';

const MIN_PUBLIC_PROMPT_VOTES_THRESHOLD = 5;

// Quota messages shown in the modal when user quota is exceeded - replaced with quota-messages.json (when available)
let QuotaMessages = {
  CONNECT_ACCOUNT_ANNOUNCEMENT: /*html*/ `
  <h3>Connect OpenAI and AIPRM Accounts</h3>

  <p class="AIPRM__my-4">
    We are excited to announce that you can now connect your OpenAI account with your AIPRM account.
    <br><br>
    This will allow you to save a favorite prompt to the "Favorites" prompts list and to try more of our premium features before subscribing to a premium AIPRM plan.
    <br><br>
    If you don't have an AIPRM account yet, you can create one for free.
  </p>`,

  CONNECT_ACCOUNT_TO_USE_FAVORITES: /*html*/ `
  <h3>Connect OpenAI and AIPRM Accounts</h3>

  <p class="AIPRM__my-4">
    To use the "Favorites" prompts list, you must connect your OpenAI account with your AIPRM account.
    This will allow you to save a favorite prompt to the "Favorites" prompts list.
  </p>`,

  CONNECT_ACCOUNT_UPGRADE_TO_USE_HIDDEN: /*html*/ `
  <h3>Connect OpenAI and AIPRM Accounts</h3>

  <p class="AIPRM__my-4">
    You can hide prompts immediately. To use this feature, 
    you must connect your OpenAI account with your AIPRM account and subscribe to the <b>AIPRM Plus</b> plan or higher.
  </p>`,

  UPGRADE_ACCOUNT_TO_USE_HIDDEN: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    You can hide prompts immediately. To use this feature, please upgrade your AIPRM account to the <b>AIPRM Plus</b> plan or higher.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  UPGRADE_ACCOUNT_HIDDEN_LIST_ITEMS_QUOTA_EXCEEDED: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    To hide more prompts at the same time, please upgrade your AIPRM account to a plan with more prompts per prompts list.
    Alternatively, you can remove some prompts from your "Hidden" list to make space for new ones.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  CONNECT_ACCOUNT_UPGRADE_TO_USE_CUSTOM_LIST: /*html*/ `
  <h3>Connect OpenAI and AIPRM Accounts</h3>

  <p class="AIPRM__my-4">
    To create a custom prompt list, you must connect your OpenAI account with your AIPRM account and subscribe to the <b>AIPRM Plus</b> plan or higher.
    This will allow you to save your prompts to a custom prompt list.
  </p>`,

  UPGRADE_ACCOUNT_TO_USE_CUSTOM_LIST: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    To create a custom prompt list, you need to upgrade to the <b>AIPRM Plus</b> plan or higher.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  UPGRADE_ACCOUNT_CUSTOM_LIST_QUOTA_EXCEEDED: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    To create a new custom prompt list, please upgrade your AIPRM account to a plan with more prompts lists.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  UPGRADE_ACCOUNT_LIST_QUOTA_EXCEEDED: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    You have reached your maximum allowed prompts lists. To create more prompts lists, please upgrade your AIPRM account.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  UPGRADE_ACCOUNT_LIST_ITEM_QUOTA_EXCEEDED: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    You have reached your maximum allowed prompts per prompts list. To add more prompts to this list, please upgrade your AIPRM account.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  CONNECT_ACCOUNT_TO_USE_PRIVATE_PROMPTS: /*html*/ `
  <h3>Connect OpenAI and AIPRM Accounts</h3>

  <p class="AIPRM__my-4">
    To use private prompts, you must connect your OpenAI account with your AIPRM account.
    This will allow you to create a private prompt that is only visible to you.
  </p>`,

  UPGRADE_ACCOUNT_PRIVATE_PROMPTS_QUOTA_EXCEEDED: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    You have exceeded the number of private prompts allowed in your account.    
    If you just deleted another private prompt, please try again in a few seconds.
    <br><br>
    To create more private prompts, please upgrade your AIPRM account to a plan allowing more private prompts.
    <br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  CONNECT_ACCOUNT_TO_USE_TEAM_PROMPTS: /*html*/ `
  <h3>Connect OpenAI and AIPRM Accounts</h3>

  <p class="AIPRM__my-4">
    To use team prompts, you must connect your OpenAI account with your AIPRM account.
    This will allow you to create team prompts.
  </p>`,

  UPGRADE_ACCOUNT_PUBLIC_PROMPTS_QUOTA_EXCEEDED: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    All your allowed upcoming prompts have less than ${MIN_PUBLIC_PROMPT_VOTES_THRESHOLD} upvotes.
    You can only create a new upcoming public prompts if all your public prompts have more than ${MIN_PUBLIC_PROMPT_VOTES_THRESHOLD} upvotes.
    If you just unpublished or deleted another upcoming prompt, please try again in a few seconds.
    <br><br>
    To create more upcoming prompts at once, you can upgrade to the <b>AIPRM Pro</b> plan.
    <br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  CONNECT_ACCOUNT_PROMPT_QUOTA_EXCEEDED: /*html*/ `
  <h3>Connect OpenAI and AIPRM Accounts</h3>

  <p class="AIPRM__my-4">
    You can only create new upcoming public prompts if all your public prompts have more than ${MIN_PUBLIC_PROMPT_VOTES_THRESHOLD} upvotes.
    You can only create new private prompts if you didn't reach the limit of the max. allowed private prompts in your account.
    <br><br>
    Connect your OpenAI account with your AIPRM account to be able to create more prompts.
    <br><br>
    Then you can also upgrade your AIPRM account to a plan with more private and upcoming public prompts, or purchase multiple plans of the same type.
    <br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  UPGRADE_ACCOUNT_PROMPT_QUOTA_EXCEEDED: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    You can only create new upcoming public prompts if all your public prompts have more than ${MIN_PUBLIC_PROMPT_VOTES_THRESHOLD} upvotes.
    You can only create new private prompts if you didn't reach the limit of the max. allowed private prompts in your account.
    <br><br>
    Please try again in a few seconds, if you just unpublished or deleted another upcoming public prompt, or deleted another private prompt.
    <br><br>
    To be able to create more prompts, you can upgrade your AIPRM account to a plan with more private and upcoming public prompts, or purchase multiple plans of the same type.
    <br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  UPGRADE_ACCOUNT_CUSTOM_TONE_WRITING_STYLE: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    Upgrade to the <b>AIPRM Plus</b> plan to get additional Tones and Writing Styles.
    Upgrade to the <b>AIPRM Pro</b> plan to even add your own custom Tones and Writing Styles.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  UPGRADE_ACCOUNT_POWER_CONTINUE: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    Upgrade to a premium plan to activate the Power Continue feature.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  CONNECT_ACCOUNT_UPGRADE_AIPRM_VERIFIED_LIST: /*html*/ `
  <h3>Connect OpenAI and AIPRM Accounts</h3>

  <p class="AIPRM__my-4">
    To use the "AIPRM Verified Prompts" list, you must connect your OpenAI account with your AIPRM account and subscribe to the <b>AIPRM Pro</b> plan.
  </p>`,

  UPGRADE_ACCOUNT_AIPRM_VERIFIED_LIST: /*html*/ `  
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    To use the <b>AIPRM Verified Prompts</b> list, you must subscribe to the <b>AIPRM Pro</b> plan or higher.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  CONNECT_ACCOUNT_VIEW_PROMPT_TEMPLATE_SOURCE: /*html*/ `
  <h3>Connect OpenAI and AIPRM Accounts</h3>

  <p class="AIPRM__my-4">
    To view prompt template source, you must connect your OpenAI account with your AIPRM account and subscribe to the <b>AIPRM Elite</b> plan or higher.
  </p>`,

  UPGRADE_ACCOUNT_VIEW_PROMPT_TEMPLATE_SOURCE: /*html*/ `  
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    To view prompt template source, you must subscribe to the <b>AIPRM Elite</b> plan or higher.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  CONNECT_ACCOUNT_UPGRADE_TO_USE_LIVE_CRAWLING: /*html*/ `
  <h3>Connect OpenAI and AIPRM Accounts</h3>

  <p class="AIPRM__my-4">
    To use the Live Crawling feature, you must connect your OpenAI account with your AIPRM account and subscribe to the <b>AIPRM Elite</b> plan or higher.
  </p>`,

  UPGRADE_ACCOUNT_LIVE_CRAWLING: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    To use the Live Crawling feature, you must subscribe to the <b>AIPRM Elite</b> plan or higher.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  CONNECT_ACCOUNT_UPGRADE_TO_USE_HIDE_WATERMARK: /*html*/ `
  <h3>Connect OpenAI and AIPRM Accounts</h3>

  <p class="AIPRM__my-4">
    To use the Hide Watermark feature, you must connect your OpenAI account with your AIPRM account and subscribe to the <b>AIPRM Elite</b> plan or higher.
  </p>`,

  UPGRADE_ACCOUNT_HIDE_WATERMARK: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    To use the Hide Watermark feature, you must subscribe to the <b>AIPRM Elite</b> plan or higher.
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,

  UPGRADE_ACCOUNT_PROMPT_VARIABLE_VALUES: /*html*/ `
  <h3>Upgrade AIPRM Account</h3>

  <p class="AIPRM__my-4">
    Upgrade your AIPRM account to a higher plan to be able to use more prompt variable values.
  
    <br><br>
    <a class="AIPRM__underline" href="${AppPricingURL}">View available plans here.</a>
  </p>`,
};

// Check user quota for premium features and show modal if quota is exceeded / feature is not available
export class UserQuota {
  /** @type {import("./client").Quota} */
  #quota;

  /** @type {import("./client").User} */
  #user;

  /**
   * @param {import("./client").User} user
   * @param {import("./client").Quota} quota
   */
  constructor(user, quota) {
    this.#user = user;
    quota.TotalPrivateLists = 999;quota.MaxPrivateListItems = 9999;quota.MaxLevel = 999999;this.#quota = quota;
  }

  getMaxPlanLevelLabel() {
    if (!this.hasPaidPlan()) {
      return 'Free';
    }

    const maxPlanLevel = Object.keys(PlanLevelNo).find(
      (key) => PlanLevelNo[key] === this.#quota.MaxLevel
    );

    return maxPlanLevel ? `AIPRM ${maxPlanLevel}` : 'Unknown';
  }

  hasPaidPlan() {
    return this.#user.IsLinked && this.#quota.MaxLevel >= PlanLevelNo.BASIC;
  }

  // Fetch quota messages from server
  async fetchMessages() {
    try {
      // Fetch quota messages from server with cache buster
      const response = await fetch(
        QuotaMessagesURL +
          btoa(new Date().toISOString().slice(0, 16).toString())
      );

      if (!response.ok) {
        console.error('Could not fetch Quota Messages', response.statusText);
        return;
      }

      QuotaMessages = await response.json();
    } catch (error) {
      console.error('Could not fetch Quota Messages', error);
    }
  }

  /**
   * Check if user can use the "Favorites" prompts list
   * (requires OpenAI account to be connected with AIPRM account & max. private list items quota not exceeded)
   *
   * @param {import('./list.js').Lists} lists
   * @returns {boolean}
   */
  canUseFavorites(lists) {
    // OpenAI account must be connected to AIPRM account
    if (!this.#user.IsLinked) {
      this.showModal(
        QuotaMessages.CONNECT_ACCOUNT_TO_USE_FAVORITES,
        AppSignupURL
      );

      return false;
    }

    const favoritesList = lists.getFavorites();

    // If user has no "Favorites" list, they can create one
    if (!favoritesList) {
      return true;
    }

    // If user has a "Favorites" list, check if they can add more items to it
    if (favoritesList.Items.length >= this.#quota.MaxPrivateListItems) {
      this.listItemQuotaExceeded();

      return false;
    }

    return true;
  }

  canUseFavoritesOnlyCheck() {
    return this.#user.IsLinked;
  }

  /**
   * Check if user can use the "Hidden" prompts list
   * (requires OpenAI account to be connected with AIPRM account, min. 3 private lists quota
   *  & max. private list items quota not exceeded)
   *
   * @param {import('./list.js').Lists} lists
   * @returns {boolean}
   */
  canUseHidden(lists) {
    // OpenAI account must be connected to AIPRM account
    if (!this.#user.IsLinked) {
      this.showModal(
        QuotaMessages.CONNECT_ACCOUNT_UPGRADE_TO_USE_HIDDEN,
        AppSignupURL
      );

      return false;
    }

    const hiddenList = lists.getHidden();

    // If user has less than 3 private lists quota, they can't create a "Hidden" list
    if (this.#quota.TotalPrivateLists < 3) {
      this.showModal(
        QuotaMessages.UPGRADE_ACCOUNT_TO_USE_HIDDEN,
        AppPricingURL
      );

      return false;
    }

    // If user has no "Hidden" list, they can create one
    if (!hiddenList) {
      return true;
    }

    // If user has a "Hidden" list, check if they can add more items to it
    if (hiddenList.Items.length >= this.#quota.MaxPrivateListItems) {
      this.showModal(
        QuotaMessages.UPGRADE_ACCOUNT_HIDDEN_LIST_ITEMS_QUOTA_EXCEEDED,
        AppPricingURL
      );

      return false;
    }

    return true;
  }

  canUseHiddenOnlyCheck() {
    return this.#user.IsLinked && this.#quota.MaxLevel >= PlanLevelNo.PLUS;
  }

  /**
   * Check if user can use a custom prompt list
   * (requires OpenAI account to be connected with AIPRM account, min. 3 private lists quota
   *  & max. private lists quota not exceeded)
   *
   * @returns {boolean}
   */
  canUseCustomList() {
    // OpenAI account must be connected to AIPRM account
    if (!this.#user.IsLinked) {
      this.showModal(
        QuotaMessages.CONNECT_ACCOUNT_UPGRADE_TO_USE_CUSTOM_LIST,
        AppSignupURL
      );

      return false;
    }

    // If user has less than 3 private lists quota, they can't create a custom list
    if (this.#quota.TotalPrivateLists < 3) {
      this.showModal(
        QuotaMessages.UPGRADE_ACCOUNT_TO_USE_CUSTOM_LIST,
        AppPricingURL
      );

      return false;
    }

    return true;
  }

  canUseCustomListOnlyCheck() {
    return this.#user.IsLinked && this.#quota.MaxLevel >= PlanLevelNo.PLUS;
  }

  /**
   * Check if user can create a custom prompt list, based on their quota and existing custom lists
   *
   * @param {import('./list.js').Lists} lists
   * @returns {boolean}
   */
  canCreateCustomList(lists) {
    // Check if user can create more custom lists (2 lists are reserved for "Favorites" & "Hidden")
    if (lists.getCustomPrivate().length >= this.#quota.TotalPrivateLists - 2) {
      this.showModal(
        QuotaMessages.UPGRADE_ACCOUNT_CUSTOM_LIST_QUOTA_EXCEEDED,
        AppPricingURL
      );

      return false;
    }

    return true;
  }

  /**
   * Check if user can add a prompt to a custom list
   *
   * @param {import('./list.js').List} list
   * @returns {boolean}
   */
  canAddToCustomList(list) {
    if (list.ListTypeNo === ListTypeNo.TEAM_CUSTOM) {
      return this.hasTeamsFeatureEnabled();
    } else {
      if (list.Items.length >= this.#quota.MaxPrivateListItems) {
        this.showModal(
          QuotaMessages.UPGRADE_ACCOUNT_LIST_ITEM_QUOTA_EXCEEDED,
          AppPricingURL
        );

        return false;
      }
    }

    return true;
  }

  canUseTeamListOnlyCheck() {
    return this.#user.IsLinked && this.hasTeamsFeatureEnabled();
  }

  /**
   * Check if user can use the "AIPRM Verified Prompts" list
   *
   * @param {boolean} showModal
   * @returns {boolean}
   */
  canUseAIPRMVerifiedList(showModal = true) {
    // OpenAI account must be connected to AIPRM account
    if (!this.#user.IsLinked) {
      showModal &&
        this.showModal(
          QuotaMessages.CONNECT_ACCOUNT_UPGRADE_AIPRM_VERIFIED_LIST,
          AppSignupURL
        );

      return false;
    }

    // No access to "AIPRM Verified" list if plan is lower than Pro
    if (this.#quota.MaxLevel < PlanLevelNo.PRO) {
      showModal &&
        this.showModal(
          QuotaMessages.UPGRADE_ACCOUNT_AIPRM_VERIFIED_LIST,
          AppPricingURL
        );

      return false;
    }

    return true;
  }

  /**
   * Check if user can use the "View Prompt Template Source"
   *
   * @returns {boolean}
   */
  canUseViewPromptTemplateSource() {
    // OpenAI account must be connected to AIPRM account
    if (!this.#user.IsLinked) {
      this.showModal(
        QuotaMessages.CONNECT_ACCOUNT_VIEW_PROMPT_TEMPLATE_SOURCE,
        AppSignupURL
      );

      return false;
    }

    // No access to "View Prompt Template Source" if plan is lower than Elite
    if (this.#quota.MaxLevel < PlanLevelNo.ELITE) {
      this.showModal(
        QuotaMessages.UPGRADE_ACCOUNT_VIEW_PROMPT_TEMPLATE_SOURCE,
        AppPricingURL
      );

      return false;
    }

    return true;
  }

  // "Quota exceeded" response from API (max. lists)
  listQuotaExceeded() {
    this.showModal(
      QuotaMessages.UPGRADE_ACCOUNT_LIST_QUOTA_EXCEEDED,
      AppPricingURL
    );
  }

  // "Quota exceeded" response from API (max. list items)
  listItemQuotaExceeded() {
    this.showModal(
      QuotaMessages.UPGRADE_ACCOUNT_LIST_ITEM_QUOTA_EXCEEDED,
      AppPricingURL
    );
  }

  /**
   * Check if user can create a private prompt template
   * (requires OpenAI account to be connected with AIPRM account & max. private prompts quota not exceeded)
   *
   * @param {import('./inject.js').Prompt[]} ownPrompts
   * @returns {boolean}
   */
  canCreatePrivatePromptTemplate(ownPrompts = []) {
    // OpenAI account must be connected to AIPRM account
    if (!this.#user.IsLinked) {
      return false;
    }

    // Check only own prompts with type "Private"
    const ownPrivatePrompts = ownPrompts.filter(
      (prompt) => prompt.PromptTypeNo === PromptTypeNo.PRIVATE
    );

    // Check if user can add more private prompts
    if (ownPrivatePrompts.length >= this.#quota.TotalPromptStorePrivate) {
      return false;
    }

    return true;
  }

  /**
   * Check if user can create a public prompt template
   * (requires max. upcoming public prompts quota not exceeded)
   *
   * @param {import('./inject.js').Prompt[]} ownPrompts
   * @returns {boolean}
   */
  canCreatePublicPromptTemplate(ownPrompts = []) {
    // TODO: only users with connected OpenAI and AIPRM account or all users can add public prompts?

    const ownPublicPrompts = ownPrompts.filter(
      (prompt) =>
        prompt.PromptTypeNo === PromptTypeNo.PUBLIC &&
        prompt.Votes < MIN_PUBLIC_PROMPT_VOTES_THRESHOLD
    );

    if (ownPublicPrompts.length >= this.#quota.MaxPromptPublicUpcoming) {
      return false;
    }

    return true;
  }

  /**
   * Check if user can create a team prompt template
   *
   * @param {import('./inject.js').Prompt[]} ownPrompts
   * @returns {boolean}
   */
  canCreateTeamPromptTemplate(ownPrompts = []) {
    // OpenAI account must be connected to AIPRM account
    if (!this.#user.IsLinked) {
      return false;
    }

    if (!this.hasTeamsFeatureEnabled()) {
      return false;
    }

    return true;
  }

  // Exceeded max. public prompts quota
  publicPromptsQuotaExceeded() {
    this.showModal(
      QuotaMessages.UPGRADE_ACCOUNT_PUBLIC_PROMPTS_QUOTA_EXCEEDED,
      AppPricingURL
    );
  }

  // Exceeded max. private prompts quota
  privatePromptsQuotaExceeded() {
    if (!this.#user.IsLinked) {
      this.showModal(
        QuotaMessages.CONNECT_ACCOUNT_TO_USE_PRIVATE_PROMPTS,
        AppSignupURL
      );

      return;
    }

    this.showModal(
      QuotaMessages.UPGRADE_ACCOUNT_PRIVATE_PROMPTS_QUOTA_EXCEEDED,
      AppPricingURL
    );
  }

  // Exceeded max. team prompts quota
  teamPromptsQuotaExceeded() {
    if (!this.#user.IsLinked) {
      this.showModal(
        QuotaMessages.CONNECT_ACCOUNT_TO_USE_TEAM_PROMPTS,
        AppSignupURL
      );

      return;
    }
  }

  // "Quota exceeded" response from API (either max. private prompts or max. upcoming public prompts)
  promptQuotaExceeded() {
    if (!this.#user.IsLinked) {
      this.showModal(
        QuotaMessages.CONNECT_ACCOUNT_PROMPT_QUOTA_EXCEEDED,
        AppSignupURL
      );

      return;
    }

    this.showModal(
      QuotaMessages.UPGRADE_ACCOUNT_PROMPT_QUOTA_EXCEEDED,
      AppPricingURL
    );
  }

  /**
   * Check if user can use a custom tone
   *
   * @param {import('./inject.js').Tone} Tone
   * @returns {boolean}
   */
  canUseCustomTone(Tone = null) {
    // Plan level must be at least "Plus"
    if (this.#quota.MaxLevel >= PlanLevelNo.PLUS) {
      return true;
    }

    if (!Tone) {
      return false;
    }

    // Allow only selected Tones for all users
    return ['Emotional'].includes(Tone.Label);
  }

  // Show modal to upgrade account to use all available tones
  upgradeCustomTone() {
    this.showModal(
      QuotaMessages.UPGRADE_ACCOUNT_CUSTOM_TONE_WRITING_STYLE,
      AppPricingURL
    );
  }

  /**
   * Check if user can use a custom writing style
   *
   * @param {import('./inject.js').WritingStyle} WritingStyle
   * @returns {boolean}
   */
  canUseCustomWritingStyle(WritingStyle = null) {
    // Plan level must be at least "Plus"
    if (this.#quota.MaxLevel >= PlanLevelNo.PLUS) {
      return true;
    }

    if (!WritingStyle) {
      return false;
    }

    // Allow only selected Writing Styles for all users
    return ['Poetic'].includes(WritingStyle.Label);
  }

  // Show modal to upgrade account to use all available writing styles
  upgradeCustomWritingStyle() {
    this.showModal(
      QuotaMessages.UPGRADE_ACCOUNT_CUSTOM_TONE_WRITING_STYLE,
      AppPricingURL
    );
  }

  // Check if user can use "Power Continue" (requires certain plan level)
  canUsePowerContinue() {
    // Plan level must be at least "BASIC"
    return this.#quota.MaxLevel >= PlanLevelNo.BASIC;
  }

  // Show modal to upgrade account to use "Power Continue"
  upgradePowerContinue() {
    this.showModal(QuotaMessages.UPGRADE_ACCOUNT_POWER_CONTINUE, AppPricingURL);
  }

  // Check if user can use "Live Crawling" (requires certain plan level)
  canUseLiveCrawling() {
    // Plan level must be at least "ELITE"
    if (this.#quota.MaxLevel >= PlanLevelNo.ELITE) {
      return true;
    }

    // Show modal to upgrade account to use "Live Crawling" (or connect OpenAI account to AIPRM account and then upgrade, if not connected)
    this.showModal(
      !this.#user.IsLinked
        ? QuotaMessages.CONNECT_ACCOUNT_UPGRADE_TO_USE_LIVE_CRAWLING
        : QuotaMessages.UPGRADE_ACCOUNT_LIVE_CRAWLING,
      !this.#user.IsLinked ? AppSignupURL : AppPricingURL
    );

    return false;
  }

  // Check if user can use "Hide Watermark" (requires certain plan level)
  canUseHideWatermark(showModal = true) {
    // Plan level must be at least "ELITE"
    if (this.#quota.MaxLevel >= PlanLevelNo.ELITE) {
      return true;
    }

    if (showModal) {
      // Show modal to upgrade account to use "Hide Watermark" (or connect OpenAI account to AIPRM account and then upgrade, if not connected)
      this.showModal(
        !this.#user.IsLinked
          ? QuotaMessages.CONNECT_ACCOUNT_UPGRADE_TO_USE_HIDE_WATERMARK
          : QuotaMessages.UPGRADE_ACCOUNT_HIDE_WATERMARK,
        !this.#user.IsLinked ? AppSignupURL : AppPricingURL
      );
    }

    return false;
  }

  /**
   * Show modal with announcement to connect OpenAI account to AIPRM account
   *
   * @returns {boolean}
   */
  connectAccountAnnouncement() {
    if (this.#user.IsLinked) {
      return false;
    }

    this.showModal(
      QuotaMessages.CONNECT_ACCOUNT_ANNOUNCEMENT,
      AppSignupURL,
      true
    );

    return true;
  }

  /**
   * Show modal with message and action URL to redirect user to after clicking on "Continue" button
   *
   * @param {string} message
   * @param {string} actionURL
   */
  showModal(message = '', actionURL = '', showMessages = false) {
    let quotaMessageModal = document.getElementById('quotaMessageModal');

    // if modal does not exist, create it, add event listener on submit and append it to body
    if (!quotaMessageModal) {
      quotaMessageModal = document.createElement('div');
      quotaMessageModal.id = 'quotaMessageModal';

      document.body.appendChild(quotaMessageModal);
    }

    quotaMessageModal.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__text-center AIPRM__transition-opacity AIPRM__z-50">
        <div class="AIPRM__absolute AIPRM__bg-gray-900 AIPRM__inset-0 AIPRM__opacity-90">
        </div>

        <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__overflow-y-auto">
          <div class="AIPRM__flex AIPRM__items-center AIPRM__justify-center AIPRM__min-h-full">
            <div
              class="AIPRM__align-center AIPRM__bg-white dark:AIPRM__bg-gray-800 dark:AIPRM__text-gray-200 AIPRM__inline-block AIPRM__overflow-hidden sm:AIPRM__rounded-lg AIPRM__shadow-xl sm:AIPRM__align-middle sm:AIPRM__max-w-lg sm:AIPRM__my-8 sm:AIPRM__w-full AIPRM__text-left AIPRM__transform AIPRM__transition-all"
              role="dialog" aria-modal="true" aria-labelledby="modal-headline">

              <div class="AIPRM__bg-white dark:AIPRM__bg-gray-800 AIPRM__px-4 AIPRM__pt-5 AIPRM__pb-4 sm:AIPRM__p-6 sm:AIPRM__pb-4">
                ${message}
              </div>

              <div class="AIPRM__bg-gray-200 dark:AIPRM__bg-gray-700 AIPRM__px-4 AIPRM__py-3 AIPRM__text-right">
                <button id="quotaMessageModalCancel" type="button" class="AIPRM__bg-gray-600 hover:AIPRM__bg-gray-800 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white">Cancel</button>
                <button id="quotaMessageModalSubmit" class="AIPRM__bg-green-600 hover:AIPRM__bg-green-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white">Continue</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    // add event listener to close the modal on ESC
    const keydownListener = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    // close modal and remove event listener on ESC
    const closeModal = () => {
      window.AIPRM.hideModal('quotaMessageModal', showMessages);
      document.removeEventListener('keydown', keydownListener);
    };

    document.addEventListener('keydown', keydownListener);

    // add event listener for quotaMessageModalCancel button
    const quotaMessageModalCancel = document.getElementById(
      'quotaMessageModalCancel'
    );

    if (quotaMessageModalCancel) {
      quotaMessageModalCancel.addEventListener('click', closeModal);
    }

    // add event listener for quotaMessageModalSubmit button
    const quotaMessageModalSubmit = document.getElementById(
      'quotaMessageModalSubmit'
    );

    if (quotaMessageModalSubmit) {
      quotaMessageModalSubmit.addEventListener('click', () => {
        closeModal();

        // open action URL in new tab
        window.open(actionURL, '_blank');
      });
    }

    // show modal
    quotaMessageModal.style = 'display: block;';
  }

  /**
   * Returns how many prompt variable enum values can be added to the prompt and used in the prompt
   *
   * @param {boolean} showModal
   * @returns {boolean}
   */
  promptVariableEnumMaxSize() {
    // OpenAI account must be connected to AIPRM account
    // and AIPRM account must be at least "BASIC" plan level
    if (this.#user.IsLinked && this.#quota.MaxLevel >= PlanLevelNo.BASIC) {
      return 100;
    }

    return 3;
  }

  upgradePromptVariableEnumMaxSize() {
    this.showModal(
      QuotaMessages.UPGRADE_ACCOUNT_PROMPT_VARIABLE_VALUES,
      AppPricingURL
    );
  }

  /**
   * @param {FeatureBitset} feature
   * @returns {boolean}
   */
  hasFeatureEnabled(feature) {
    return (this.#user.FeatureBitset & feature) === feature;
  }

  hasTeamsFeatureEnabled() {
    return this.hasFeatureEnabled(FeatureBitset.TEAMS);
  }
}
