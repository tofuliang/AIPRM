import { capitalizeWords, sanitizeInput } from './utils.js';

/** @typedef {{roles: string[], tasks: string[], constraints: string[], contexts: string[]}} PromptBuilderOptions */

export class PromptBuilder {
  /** @type {string[]} */
  roles = [];

  /** @type {string[]} */
  tasks = [];

  /** @type {string[]} */
  constraints = [];

  /** @type {string[]} */
  contexts = [];

  /** @type {import("./inject").Prompt} */
  prompt = {};

  /** @param {PromptBuilderOptions} options */
  constructor(options) {
    this.roles = options.roles;
    this.tasks = options.tasks;
    this.constraints = options.constraints;
    this.contexts = options.contexts;
  }

  /** @returns {string} */
  render() {
    return /*html*/ `
      <div>Prompt Builder</div>

      <div class="AIPRM__w-full AIPRM__bg-gray-100 AIPRM__border-gray-500 AIPRM__border dark:AIPRM__bg-gray-800 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__p-4 AIPRM__mt-2 AIPRM__mb-3" id="AIPRM__PromptBuilder-Prompt">
        <div class="AIPRM__flex AIPRM__gap-2 AIPRM__items-end">
          <span class="AIPRM__whitespace-nowrap">You are </span>

          <div class="AIPRM__flex AIPRM__flex-1 AIPRM__flex-col">
            <label for="AIPRM__act-as-input" class="AIPRM__block AIPRM__text-xs AIPRM__text-gray-700 dark:AIPRM__text-gray-400">Role</label>
            <input list="AIPRM__act-as-options" id="AIPRM__act-as-input" placeholder="Choose role or enter..." class="AIPRM__rounded AIPRM__border AIPRM__border-green-500 AIPRM__bg-green-100 dark:AIPRM__bg-green-500/20 AIPRM__px-2" />
            <datalist id="AIPRM__act-as-options">
              ${this.roles
                .map(
                  (role) =>
                    `<option value="${sanitizeInput(role)}">${sanitizeInput(
                      role
                    )}</option>`
                )
                .join('')}
            </datalist>
          </div>
        </div>

        <div class="AIPRM__flex AIPRM__items-end AIPRM__mt-4">
          <span class="AIPRM__whitespace-nowrap">and you are asked to</span>

          <div class="AIPRM__flex AIPRM__flex-1 AIPRM__flex-col AIPRM__ml-2">
            <label for="AIPRM__do-this-input" class="AIPRM__block AIPRM__text-xs AIPRM__text-gray-700 dark:AIPRM__text-gray-400">Task</label>
            <input list="AIPRM__do-this-options" id="AIPRM__do-this-input" placeholder="Choose task or enter..." class="AIPRM__rounded AIPRM__border AIPRM__border-blue-500 AIPRM__bg-blue-100 dark:AIPRM__bg-blue-500/20 AIPRM__px-2" />
            <datalist id="AIPRM__do-this-options">
              ${this.tasks
                .map(
                  (task) =>
                    `<option value="${sanitizeInput(task)}">${sanitizeInput(
                      task
                    )}</option>`
                )
                .join('')}
            </datalist>
          </div>,
        </div>

        <div class="AIPRM__flex AIPRM__items-end AIPRM__mt-4 AIPRM__gap-2">
          <span class="AIPRM__whitespace-nowrap">but</span>

          <div class="AIPRM__flex AIPRM__flex-1 AIPRM__flex-col">
            <label for="AIPRM__dont-do-this-input" class="AIPRM__block AIPRM__text-xs AIPRM__text-gray-700 dark:AIPRM__text-gray-400">Constraints</label>
            <input list="AIPRM__dont-do-this-options" id="AIPRM__dont-do-this-input" placeholder="Choose constraints or enter..." class="AIPRM__rounded AIPRM__border AIPRM__border-orange-500 AIPRM__bg-orange-100 dark:AIPRM__bg-orange-500/20 AIPRM__px-2" />
            <datalist id="AIPRM__dont-do-this-options">
              ${this.constraints
                .map(
                  (constraint) =>
                    `<option value="${sanitizeInput(
                      constraint
                    )}">${sanitizeInput(constraint)}</option>`
                )
                .join('')}
            </datalist>
          </div>
        </div>

        <div class="AIPRM__flex AIPRM__items-end AIPRM__mt-4">
          <span class="AIPRM__whitespace-nowrap">in the context of</span>
          <div class="AIPRM__flex AIPRM__flex-1 AIPRM__flex-col AIPRM__ml-2">
            <label for="AIPRM__dont-do-this-input" class="AIPRM__block AIPRM__text-xs AIPRM__text-gray-700 dark:AIPRM__text-gray-400">Context</label>
            <input list="AIPRM__context-options" id="AIPRM__context-input" placeholder="Choose context or enter..." class="AIPRM__rounded AIPRM__border AIPRM__border-purple-500 AIPRM__bg-purple-100 dark:AIPRM__bg-purple-500/20 AIPRM__px-2" />
            <datalist id="AIPRM__context-options">
              ${this.contexts
                .map(
                  (context) =>
                    `<option value="${sanitizeInput(context)}">${sanitizeInput(
                      context
                    )}</option>`
                )
                .join('')}
            </datalist>
          </div>.
        </div>

        <br>

        Reply only in &nbsp;<span title='This will change depending on selected "Output in" language' class="AIPRM__my-2 AIPRM__bg-gray-200 dark:AIPRM__bg-gray-600 AIPRM__p-1"><code>[TARGETLANGUAGE]</code></span>&nbsp; language.
        
        <br><br>
        
        Your task is: &nbsp;<span title="This will change depending on the prompt message you enter" class="AIPRM__my-2 AIPRM__bg-gray-200 dark:AIPRM__bg-gray-600 AIPRM__p-1"><code>[PROMPT]</code></span>
      </div>`;
  }

  get() {
    return this.prompt;
  }

  build() {
    const role = document.getElementById('AIPRM__act-as-input').value;
    const task = document.getElementById('AIPRM__do-this-input').value;
    const constraint = document.getElementById(
      'AIPRM__dont-do-this-input'
    ).value;
    const context = document.getElementById('AIPRM__context-input').value;

    if (!role || !task || !constraint || !context) {
      this.prompt.Prompt = '';

      return;
    }

    this.prompt.Prompt = `You are ${role} and you are asked to ${task}, but ${constraint} in the context of ${context}.

Reply only in [TARGETLANGUAGE] language.

Your task is: [PROMPT]`;

    this.prompt.Title = `${capitalizeWords(role)} - ${capitalizeWords(task)}`;
    this.prompt.Teaser = `Helpful ${capitalizeWords(
      role
    )} ready to ${capitalizeWords(task)}`;
    this.prompt.PromptHint = 'Please ...';
  }
}
