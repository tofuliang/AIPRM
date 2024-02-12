/* eslint-disable no-unused-vars */
import {
  MessageSeverityNo,
  MessageStatusNo,
  MessageVoteTypeNo,
} from './enums.js';
/* eslint-enable */

import { hideModal, svg } from './utils.js';

// Mapping of MessageSeverityNo to the corresponding CSS class name for the notification message
const NotificationMessageSeverityClassName = {
  [MessageSeverityNo.INFO]: 'AIPRM__bg-gray-500',
  [MessageSeverityNo.SUCCESS]: 'AIPRM__bg-green-500',
  [MessageSeverityNo.UPDATE]: 'AIPRM__bg-[#5436DA]',
};

/**
 * Show the first active and not expired static message (if any),
 * or the first active and not expired message with MessageSeverityNo.MANDATORY_MUST_CONFIRM (if any),
 * or the first active and not expired message with other MessageSeverityNo (if any)
 *
 * @param {import("./client").Message[]} staticMessages
 * @param {import("./client").Message[]} messages
 * @param {(MessageID: string)} confirmCallback
 * @param {(MessageID: string, Vote: MessageVoteTypeNo)} voteCallback
 * @param {(MessageID: string)} readStaticMessageCallback
 * @returns {boolean} true if a message was shown, false otherwise
 */
const showMessage = (
  staticMessages,
  messages,
  confirmCallback,
  voteCallback,
  readStaticMessageCallback
) => {
  // get the first active and not expired static message
  let staticMessage = staticMessages?.find(
    (message) =>
      message.MessageStatusNo === MessageStatusNo.ACTIVE &&
      (!message.ExpiryTime || new Date(message.ExpiryTime) > new Date())
  );

  // if there is a static message, show it
  if (staticMessage) {
    createNotificationMessage(staticMessage, readStaticMessageCallback);

    return true;
  }

  // get the first active and not expired message with MessageSeverityNo.MANDATORY_MUST_CONFIRM
  let message = messages?.find(
    (message) =>
      message.MessageStatusNo === MessageStatusNo.ACTIVE &&
      message.MessageSeverityNo === MessageSeverityNo.MANDATORY_MUST_CONFIRM &&
      (!message.ExpiryTime || new Date(message.ExpiryTime) > new Date())
  );

  // if there is a message with MessageSeverityNo.MANDATORY_MUST_CONFIRM, show it
  if (message) {
    createConfirmMessageModal(message, confirmCallback);

    return true;
  }

  // otherwise, get the first active and not expired message with other MessageSeverityNo (if any)
  message = messages?.find(
    (message) =>
      message.MessageStatusNo === MessageStatusNo.ACTIVE &&
      message.MessageSeverityNo !== MessageSeverityNo.MANDATORY_MUST_CONFIRM &&
      (!message.ExpiryTime || new Date(message.ExpiryTime) > new Date())
  );

  // if there is no message, return - otherwise show it
  if (!message) {
    return false;
  }

  createNotificationMessage(message, voteCallback);

  return true;
};

/**
 * Create a modal to confirm a message with MessageSeverityNo.MANDATORY_MUST_CONFIRM
 *
 * @param {import("./client").Message} message
 * @param {(MessageID: string)} confirmCallback
 */
const createConfirmMessageModal = (message, confirmCallback) => {
  let confirmMessageModal = document.getElementById('confirmMessageModal');

  // if modal does not exist, create it, add event listener on submit and append it to body
  if (!confirmMessageModal) {
    confirmMessageModal = document.createElement('div');
    confirmMessageModal.id = 'confirmMessageModal';

    // add event listener on submit to call confirmCallback and hide modal on success
    confirmMessageModal.addEventListener('submit', async (e) => {
      e.preventDefault();

      const MessageID = e.target.MessageID.value;

      if (await confirmCallback(MessageID)) {
        hideModal('confirmMessageModal');
      }
    });

    document.body.appendChild(confirmMessageModal);
  }

  confirmMessageModal.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__text-center AIPRM__transition-opacity AIPRM__z-50">
        <div class="AIPRM__absolute AIPRM__bg-black/50 dark:AIPRM__bg-black/80 AIPRM__inset-0">
        </div>

        <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__overflow-y-auto">
          <div class="AIPRM__flex AIPRM__items-center AIPRM__justify-center AIPRM__min-h-full">
            <form>
              <div
                class="AIPRM__align-center AIPRM__bg-white dark:AIPRM__bg-gray-900 dark:AIPRM__text-gray-200 AIPRM__inline-block AIPRM__overflow-hidden sm:AIPRM__rounded-lg AIPRM__shadow-xl sm:AIPRM__align-middle sm:AIPRM__max-w-2xl sm:AIPRM__my-8 sm:AIPRM__w-full AIPRM__text-left AIPRM__transform AIPRM__transition-all AIPRM__prose dark:AIPRM__prose-invert"
                role="dialog" aria-modal="true" aria-labelledby="modal-headline">

                <div class="AIPRM__bg-white dark:AIPRM__bg-gray-900 AIPRM__px-4 AIPRM__pt-5 AIPRM__pb-4 sm:AIPRM__p-6 sm:AIPRM__pb-4">

                  <h3 class="AIPRM__mt-1 AIPRM__mb-6">${message.MessageSubject}</h3>

                  <div class="AIPRM__mb-6 AIPRM__overflow-y-auto">${message.MessageBodyHTML}</div>

                  <label class="AIPRM__font-semibold">
                    <input name="MessageID" value="${message.MessageID}" type="checkbox" class="AIPRM__mr-2 dark:AIPRM__bg-gray-700" required> 
                    I read and accept these terms & conditions
                  </label>
                </div>

                <div class="AIPRM__bg-gray-200 dark:AIPRM__bg-gray-850 AIPRM__px-4 AIPRM__py-3 AIPRM__text-right">
                  <button type="submit" id="reportPromptSubmitButton" class="AIPRM__bg-green-600 hover:AIPRM__bg-green-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white">Confirm
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>`;

  confirmMessageModal.style = 'display: block;';
};

/**
 * Create a notification message with thumb up/down buttons
 *
 * @param {import("./client").Message} message
 * @param {(MessageID: string, Vote: MessageVoteTypeNo)} voteCallback
 */
const createNotificationMessage = (message, voteCallback) => {
  const className =
    NotificationMessageSeverityClassName[message.MessageSeverityNo];

  const notificationElement = document.createElement('div');

  notificationElement.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__flex AIPRM__justify-center AIPRM__w-full AIPRM__top-2 AIPRM__px-2 AIPRM__z-50 AIPRM__pointer-events-none">
        <div class="${className} AIPRM__flex AIPRM__pointer-events-auto AIPRM__px-6 AIPRM__py-3 AIPRM__rounded-md AIPRM__text-white" role="alert" style="min-width: 30rem;">
          <div class="AIPRM__flex AIPRM__flex-col AIPRM__gap-2 AIPRM__w-full">

            <h4 class="AIPRM__w-full">${message.MessageSubject}</h4>

            <div class="AIPRM__prose AIPRM__w-full AIPRM__text-white">
              ${message.MessageBodyHTML}
            </div> 

            <div class="AIPRM__flex AIPRM__gap-4 AIPRM__mt-4" style="justify-content: end;">
              <button data-message-vote-type-no="${
                MessageVoteTypeNo.MESSAGE_LIKE
              }" title="I like this">${svg('ThumbUp')}</button>
              <button data-message-vote-type-no="${
                MessageVoteTypeNo.MESSAGE_DISLIKE
              }" title="I don't like this">${svg('ThumbDown')}</button>
            </div>

          </div>
        </div>
      </div>
    `;

  // add event listener on like and dislike button to call voteCallback with MessageVoteTypeNo from data attribute and hide notification on success
  notificationElement.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', async (e) => {
      if (
        await voteCallback(
          message.MessageID,
          +e.target.closest('button').dataset.messageVoteTypeNo
        )
      ) {
        notificationElement.remove();
      }
    });
  });

  document.body.appendChild(notificationElement);
};

export { showMessage };
