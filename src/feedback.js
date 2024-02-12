import { FeedbackTypeNo } from './enums.js';
import { hideModal } from './utils.js';

/**
 * Create modal to report feedback for a prompt
 *
 * @param {import('./inject.js').Prompt} prompt
 * @param {function(Event)} reportPrompt
 */
const createReportPromptModal = function (prompt, reportPrompt) {
  // prompt does not exist
  if (!prompt) {
    return;
  }

  // cannot report own prompts
  if (prompt.OwnPrompt) {
    return;
  }

  let reportPromptModal = document.getElementById('reportPromptModal');

  // if modal does not exist, create it, add event listener on submit and append it to body
  if (!reportPromptModal) {
    reportPromptModal = document.createElement('div');
    reportPromptModal.id = 'reportPromptModal';

    reportPromptModal.addEventListener('submit', reportPrompt);

    document.body.appendChild(reportPromptModal);
  }

  reportPromptModal.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__text-center AIPRM__transition-opacity AIPRM__z-50">
        <div class="AIPRM__absolute AIPRM__bg-black/50 dark:AIPRM__bg-black/80 AIPRM__inset-0">
        </div>

        <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__overflow-y-auto">
          <div class="AIPRM__flex AIPRM__items-center AIPRM__justify-center AIPRM__min-h-full">
            <div
              class="AIPRM__align-center AIPRM__bg-white dark:AIPRM__bg-gray-900 dark:AIPRM__text-gray-200 AIPRM__inline-block AIPRM__overflow-hidden sm:AIPRM__rounded-lg AIPRM__shadow-xl sm:AIPRM__align-middle sm:AIPRM__max-w-lg sm:AIPRM__my-8 sm:AIPRM__w-full AIPRM__text-left AIPRM__transform AIPRM__transition-all"
              role="dialog" aria-modal="true" aria-labelledby="modal-headline">

              <div class="AIPRM__bg-white dark:AIPRM__bg-gray-900 AIPRM__px-4 AIPRM__pt-5 AIPRM__pb-4 sm:AIPRM__p-6 sm:AIPRM__pb-4">

                <div id="reportPromptIntroText">
                  <p class="AIPRM__mb-6">
                    Thanks for helping us improve.<br><br>

                    We need you to answer a few questions so we can better understand what's going on with this Prompt.<br><br>

                    You'll also have the option to add more info in your own words and add more details to the report.<br><br>

                    We take reports seriously.<br><br>

                    If we find a rule violation, we'll either remove the Prompt immediately or ask them to revise, or lock or suspend the account.
                  </p>

                  <div class="AIPRM__mt-2">
                    <label for="FeedbackTypeNo" class="AIPRM__block">What would you like to report?</label>
                    <select data-prompt-id="${prompt.ID}" id="FeedbackTypeNo" name="FeedbackTypeNo" class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-850 dark:AIPRM__border-gray-850 dark:hover:AIPRM__bg-gray-800 AIPRM__rounded AIPRM__w-full" required>
                      <option value="${FeedbackTypeNo.GENERIC_LEGAL_CONCERN}">
                      Legal concerns
                      </option>
                      <optgroup label="Result concerns">                        
                        <option value="${FeedbackTypeNo.NOT_MULTILINGUAL}">
                          Result in wrong language
                        </option>
                        <option value="${FeedbackTypeNo.NOT_GENERIC}">
                          Result on wrong topic/keywords
                        </option>                        
                        <option value="${FeedbackTypeNo.GENERIC_CONCERN}">
                          Prompt not working as expected
                        </option>
                      </optgroup>                  
                      <option value="${FeedbackTypeNo.SPAM}">Spam</option>
                    </select>
                  </div>
                </div>

                <div class="reportPromptFeedbackContainer AIPRM__hidden AIPRM__overflow-y-auto" id="reportPromptFeedbackForm"></div>
              </div>

              <div class="AIPRM__bg-gray-200 dark:AIPRM__bg-gray-850 AIPRM__px-4 AIPRM__py-3 AIPRM__text-right">
                <button type="button" class="AIPRM__bg-gray-600 hover:AIPRM__bg-gray-800 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white"
                        onclick="AIPRM.hideModal('reportPromptModal')"> Cancel
                </button>
                <button type="button" id="reportPromptSubmitButton" class="AIPRM__bg-green-600 hover:AIPRM__bg-green-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white">Start Report
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>`;

  // add event listener to change button text and type on click
  reportPromptModal.querySelector('#reportPromptSubmitButton').addEventListener(
    'click',
    (e) => {
      // hide intro text
      document.getElementById('reportPromptIntroText').style = 'display: none;';

      const feedbackTypeNoSelect = document.getElementById('FeedbackTypeNo');

      // show feedback type specific text & form
      const feedbackForm = document.getElementById('reportPromptFeedbackForm');

      feedbackForm.innerHTML = getFeedbackFormTemplate(
        +feedbackTypeNoSelect.value,
        feedbackTypeNoSelect.dataset.promptId
      );

      feedbackForm.classList.remove('AIPRM__hidden');

      // change button text to "Send Report" and replace event listener
      e.target.innerText = 'Send Report';

      e.target.addEventListener('click', () => {
        // submit the visible form in reportPromptModal
        document
          .querySelector(
            '#reportPromptModal .reportPromptFeedbackContainer:not(.hidden) form'
          )
          .requestSubmit();
      });
    },
    { once: true }
  );

  reportPromptModal.style = 'display: block;';

  // add event listener to close the modal on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideModal('reportPromptModal');
    }
  });
};

/**
 * Get the feedback form template for a specific feedback type
 * 
 * @param {FeedbackTypeNo} selectedFeedbackTypeNo
 * @param {string} promptID
 * @returns {string} - HTML string
 s*/
const getFeedbackFormTemplate = (selectedFeedbackTypeNo, promptID) => {
  const requiresFeedbackContactText = [
    FeedbackTypeNo.GENERIC_CONCERN,
    FeedbackTypeNo.GENERIC_LEGAL_CONCERN,
  ].includes(selectedFeedbackTypeNo);

  return /*html*/ `
    <p class="AIPRM__mb-6">
      Since we are not affiliated with OpenAI or ChatGPT,
      we are not responsible for the output of ChatGPT.<br><br>

      ${
        selectedFeedbackTypeNo === FeedbackTypeNo.GENERIC_CONCERN
          ? /*html*/ `
          But we can try to help you with results.<br><br>

          We can do this by looking at the prompt reported,
          and the output generated.

          <br><br>
          You can also report your question on <a style="text-decoration:underline" target="_blank" href="https://forum.aiprm.com/c/prompt-user-questions/6">our user forum</a> and others will try to help you there, often faster.
          <br>
        `
          : `But we will take your report about the prompt and evaluate it.
          
          <br><br>
          You can also report your question on <a style="text-decoration:underline" target="_blank" href="https://forum.aiprm.com/c/prompt-user-questions/6">our user forum</a> and others will try to help you there, often faster.
          <br>

          
          `
      }
    </p>

    <form>
      <input type="hidden" name="PromptID" value="${promptID}" />

      <input type="hidden" name="FeedbackTypeNo" value="${selectedFeedbackTypeNo}" />

      <label>Contact Email${
        !requiresFeedbackContactText
          ? ' <span class="AIPRM__text-sm AIPRM__text-gray-500">(optional)</span>'
          : ''
      }</label>
      <input name="FeedbackContact" 
        ${requiresFeedbackContactText ? ' required ' : ''} type="email"
        title="Email address to contact you in case we need more information"
        class="AIPRM__w-full AIPRM__bg-gray-100 dark:AIPRM__bg-gray-850 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__p-2 AIPRM__mt-2 AIPRM__mb-3"
        placeholder="example@example.com" />

      <label>Feedback${
        !requiresFeedbackContactText
          ? ' <span class="AIPRM__text-sm AIPRM__text-gray-500">(optional)</span>'
          : ''
      }</label>
      <textarea name="FeedbackText" 
        ${requiresFeedbackContactText ? ' required ' : ''}
        title="Short description of the issue"
        class="AIPRM__w-full AIPRM__bg-gray-100 dark:AIPRM__bg-gray-850 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__p-2 AIPRM__mt-2 AIPRM__mb-3" style="height: 140px;"
        placeholder="Please describe the issue you are having with this prompt.${
          selectedFeedbackTypeNo === FeedbackTypeNo.GENERIC_CONCERN
            ? ' Please include your full history of the prompt including the original prompt used.'
            : ''
        }"></textarea>
    </form>
  `;
};

export { createReportPromptModal };
