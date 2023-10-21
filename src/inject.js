import { AIPRMClient, Reaction } from './client.js';

import {
  ActivityFeedURL,
  AppAccountURL,
  AppCommunityForumURL,
  AppName,
  AppURL,
  AppSlogan,
  AppSloganPremium,
  Config,
  ConfigURL,
  ContinueActionsFeedURL,
  ModelFeedURL,
  CrawledSourcePlaceholder,
  CrawledTextPlaceholder,
  EndpointConversation,
  ExportFilePrefix,
  ExportHeaderPrefix,
  LanguageFeedURL,
  PromptPlaceholder,
  TargetLanguagePlaceholder,
  VariablePlaceholder,
  VariableDefinition,
  ToneFeedURL,
  TopicFeedURL,
  WritingStyleFeedURL,
  AppTeamURL,
  AppPricingURL,
  PromptBuilderFeedURL,
  ValidateVariableMaxCount,
  ValidateVariablePlaceholder,
  ValidateVariableDefinition,
} from './config.js';

/* eslint-disable no-unused-vars */
import {
  ListTypeNo,
  MessageVoteTypeNo,
  NotificationSeverity,
  PromptTemplatesType,
  PromptTypeNo,
  SortModeNo,
  SubPromptTypeNo,
  UsageTypeNo,
  UserLevelNo,
  ItemStatusNo,
  PromptFeatureBitset,
  ExternalSystemNo,
  ModelStatusNo,
  LayoutChangeType,
  CreatePromptMode,
  LicenseWarningLevelNo,
} from './enums.js';
/* eslint-enable */

import { createReportPromptModal } from './feedback.js';
import { List, Lists } from './list.js';
import { showMessage } from './messages.js';
import { ReactionNo } from './rxn.js';

import {
  capitalizeWords,
  css,
  formatDateTime,
  formatAgo,
  formatHumanReadableNumber,
  hideModal,
  sanitizeInput,
  svg,
  hasFeature,
} from './utils.js';

import { MultiselectDropdown } from './multiselect-dropdown.js';
import { PromptBuilder } from './prompt-builder.js';
import { VERSION } from './version.js';

/**
 * @typedef {Object} PromptVariable
 * @property {number} ID
 * @property {string} Label
 * @property {string} DefaultValue
 * @property {string[]} EnumS
 */

/**
 * @typedef {Object} Prompt
 * @property {string} ID
 * @property {string} Category - Activity of the prompt (e.g. "Writing")
 * @property {string} Community - Topic of the prompt (e.g. "SEO")
 * @property {string} Prompt - The prompt text
 * @property {string} PromptHint - The prompt hint text (placeholder)
 * @property {PromptTypeNo} PromptTypeNo - public, private or paid prompt
 * @property {string} Title
 * @property {string} Help
 * @property {string} Teaser
 * @property {boolean} OwnPrompt - Whether the prompt is owned by the current user
 * @property {string} RevisionTime
 * @property {string} AuthorName
 * @property {string} AuthorURL
 * @property {string} [ForkedFromPromptID]
 * @property {number} Usages
 * @property {number} Views
 * @property {number} Votes
 * @property {boolean} [IsFavorite]
 * @property {boolean} [IsHidden]
 * @property {boolean} [IsVerified]
 * @property {PromptVariable[]} [PromptVariables]
 * @property {string[]} [ModelS]
 */

/** @typedef {{langcode: string, languageEnglish: string, languageLabel: string}} Language */

/** @typedef {{ID: string, Label: string}} Topic */

/** @typedef {{ID: string, TopicID: string, Label: string}} Activity */

/** @typedef {{ID: number, Label: string}} Tone */

/** @typedef {{ID: number, Label: string}} WritingStyle */

/** @typedef {{ID: number, Label: string, Prompt: string}} ContinueAction */

/** @typedef {{ID: number, Label: string, Info: string}} MyProfileInfo */

/** @typedef {{ID: string, LabelUser: string, LabelAuthor: string, StatusNo: ModelStatusNo}} Model */

/** @typedef {{EnumMaxSizeError: boolean, Errors: string[]}} ValidatePromptVariablesResult */

const DefaultPromptActivity = 'all';
const DefaultPromptTopic = 'all';
const DefaultTargetLanguage = 'English*';
const DefaultPromptModel = 'all';

const lastPromptTopicKey = 'lastPromptTopic';
const lastPromptModelKey = 'lastPromptModel';
const lastTargetLanguageKey = 'lastTargetLanguage';
const lastPageSizeKey = 'lastPageSize';
const lastPromptTemplateTypeKey = 'lastPromptTemplateType';
const lastListIDKey = 'lastListID';
const lastCreatePromptModeKey = 'lastCreatePromptMode';

const myProfileMessageKey = 'myProfileMessageAIPRM';
const hideWatermarkKey = 'AIPRM_hideWatermark';
const includeMyProfileInfoKey = 'AIPRM_includeMyProfileInfo';
const selectedMyProfileInfoKey = 'AIPRM_selectedMyProfileInfoKey';
const licenseWarningDismissedKey = 'AIPRM_licenseWarningDismissed';
const lastSeenStaticMessageKey = 'AIPRM_lastSeenStaticMessage';

const queryParamPromptID = 'AIPRM_PromptID';
const queryParamVariable = 'AIPRM_VARIABLE';
const queryParamPrompt = 'AIPRM_Prompt';

// The number of prompts per page in the prompt templates section
const pageSizeOptions = [4, 8, 12, 16, 20];
const pageSizeDefault = 12;

const editPromptTemplateEvent = 'editPromptTemplate';
const forkPromptTemplateEvent = 'forkPromptTemplate';
const clonePromptTemplateEvent = 'clonePromptTemplate';

const variableWrapperID = 'AIPRM__variable-wrapper';
const variableIDPrefix = 'AIPRM__VARIABLE';

const headerRegexPattern = /# Prompt by AIPRM, Corp\.[\s\S]*?---\n/;

const modelMultiselectOptions = {
  style: { width: '100%' },
  placeholder: 'Not specific',
  txtSelected: 'Models Selected',
  classPrefix: 'AIPRM__',
  height: '12rem',
  optionModifier: (o, op) => {
    var modelStatusNo = o.attributes['AIPRMModelStatusNo']?.value;

    if (modelStatusNo == ModelStatusNo.ACTIVE) {
      op.title = 'Active';
    } else {
      op.classList.add('AIPRM__line-through');
      op.title = 'Deprecated';
    }
  },
  optionSelectedModifier: (o, op) => {
    var modelStatusNo = o.attributes['AIPRMModelStatusNo']?.value;

    if (modelStatusNo != ModelStatusNo.ACTIVE) {
      op.classList.add('AIPRM__line-through');
    }
  },
  selectedTitleModifier: (sels, div) => {
    var title = 'This prompt is not optimized for specific model';

    if (sels.length > 0) {
      title = sels
        .map((o) => {
          var t = o.text;

          var modelStatusNo = o.attributes['AIPRMModelStatusNo']?.value;
          if (modelStatusNo != ModelStatusNo.ACTIVE) {
            t = t + ' (Deprecated)';
          }

          return t;
        })
        .join(', ');
    }

    div.setAttribute('title', title);
  },
};

window.AIPRM = {
  // Save a reference to the original fetch function
  fetch: (window._fetch = window._fetch || window.fetch.bind(window)),

  CacheBuster: btoa(new Date().toISOString().slice(0, 16).toString()),

  Client: AIPRMClient,

  /** @type {Config} */
  Config: null,

  // Set default TargetLanguage based on last used language or default to English
  TargetLanguage:
    localStorage.getItem(lastTargetLanguageKey) === null
      ? DefaultTargetLanguage
      : localStorage.getItem(lastTargetLanguageKey),

  // Set default Tone
  Tone: null,

  // Set default WritingStyle
  WritingStyle: null,

  // Set default topic
  PromptTopic: localStorage.getItem(lastPromptTopicKey) || DefaultPromptTopic,

  // Set default activity
  PromptActivity: DefaultPromptActivity,

  // Set default sort mode
  /** @type {SortModeNo} */
  PromptSortMode: SortModeNo.TOP_VOTES_TRENDING,

  // Set default model
  PromptModel: localStorage.getItem(lastPromptModelKey) || DefaultPromptModel,

  // Set default search query
  PromptSearch: '',

  // Set default prompt templates type
  /** @type {PromptTemplatesType} */
  PromptTemplatesType: PromptTemplatesType.PUBLIC,

  /**
   * Set default prompt templates list
   *
   * @type {import('./client.js').List['ID']}
   */
  PromptTemplatesList: null,

  /** @type {Prompt[]} */
  PromptTemplates: [],

  /** @type {Prompt[]} */
  OwnPrompts: [],

  /** @type {Prompt[]} */
  TeamPrompts: [],

  /** @type {Language[]} */
  Languages: [],

  /** @type {Tone[]} */
  Tones: [],

  /** @type {WritingStyle[]} */
  WritingStyles: [],

  /** @type {ContinueAction[]} */
  ContinueActions: [],

  /** @type {MyProfileInfo[]} */
  MyProfileInfos: [],

  /** @type {Model[]} */
  Models: [],

  /** @type {Model[]} */
  ModelsActive: [],

  /** @type {PromptBuilder} */
  PromptBuilder: null,

  /** @type {import('./prompt-builder.js').PromptBuilderOptions} */
  PromptBuilderOptions: {},

  /** @type {Lists} */
  Lists: new Lists(),

  /** @type {Topic[]} */
  Topics: [],

  /** @type {Activity[]} */
  Activities: [],

  // true if admin mode is enabled
  AdminMode: false,

  // This object contains properties for the prompt templates section
  PromptTemplateSection: {
    currentPage: 0, // The current page number
    pageSize: +localStorage.getItem(lastPageSizeKey) || pageSizeDefault, // The number of prompts per page
  },

  /** @type {?Prompt} */
  SelectedPromptTemplate: null,

  /** @type {import('./client.js').Message[]} */
  Messages: [],

  /** @type {import('./client.js').Message[]} */
  StaticMessages: [],

  isMessageShown: false,

  // Selected my profile info to include in the submitted prompt
  IncludeMyProfileMessage:
    localStorage.getItem(includeMyProfileInfoKey) === 'true' ? true : false,
  SelectedMyProfileInfoID:
    +localStorage.getItem(selectedMyProfileInfoKey) || null,

  // Prefill prompt via event
  PrefillPrompt: null,

  // Check version using version server
  async checkVersion() {
    try {
      const response = await this.fetch(
        `https://version.aiprm.com/check/${VERSION}?v=${this.CacheBuster}`
      );

      if (!response.ok) {
        throw new Error('Could not check for updates');
      }

      const versionCheck = await response.json();

      if (!versionCheck?.IsOutdated) {
        return;
      }

      // Version is outdated - display a warning message
      const elementID = 'AIPRM-VersionWarning';
      let element = document.getElementById(elementID);

      // If the warning doesn't exist, create it
      if (!element) {
        element = document.createElement('div');
        element.id = elementID;
      }

      element.innerHTML = /*html*/ `
          <div class="AIPRM__fixed AIPRM__flex AIPRM__justify-center AIPRM__w-full AIPRM__top-0 AIPRM__z-50 AIPRM__pointer-events-none">
            <div class="AIPRM__bg-red-500 AIPRM__w-full AIPRM__justify-center  AIPRM__flex AIPRM__flex-row AIPRM__pointer-events-auto AIPRM__px-6 AIPRM__py-6 AIPRM__text-white" role="alert">
              <div class="AIPRM__flex AIPRM__gap-4">
                <div>
                  <p class="AIPRM__max-w-2xl" style="overflow-wrap: anywhere;">
                    ${versionCheck.Message}
                  </p>
                </div>
                <button>${svg('Cross')}</button>
              </div>
            </div>
          </div>
        `;

      // Remove the warning from the DOM on click
      element.querySelector('button').addEventListener('click', () => {
        element.remove();
      });

      document.body.appendChild(element);
    } catch (error) {
      // Display fallback information
      this.showNotification(
        NotificationSeverity.ERROR,
        'Could not check for updates.'
      );
    }
  },

  // Fetch static static messages from remote JSON file
  async fetchStaticMessages() {
    try {
      const response = await this.fetch(
        `https://static.aiprm.com/${VERSION}/messages.json?v=${this.CacheBuster}`
      );

      if (!response.ok) {
        throw new Error('Could not load static messages');
      }

      /** @type {import('./client.js').Message[]} */
      let messages = await response.json();

      this.StaticMessages = messages?.length > 0 ? messages : [];

      // no new messages
      if (!this.getUnseenStaticMessages().length) {
        return;
      }

      this.showMessages();
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Could not fetch static messages.'
      );
    }
  },

  // Get the last seen static message ID from local storage and filter out messages before this ID (including this ID)
  getUnseenStaticMessages() {
    // skip messages before the last seen message
    const lastSeenStaticMessage = +localStorage.getItem(
      lastSeenStaticMessageKey
    );

    this.StaticMessages = !lastSeenStaticMessage
      ? this.StaticMessages
      : this.StaticMessages.filter(
          (message) => message.MessageID > lastSeenStaticMessage
        );

    return this.StaticMessages;
  },

  async init() {
    console.log('AIPRM init');

    // check version before initializing
    await this.checkVersion();

    // fetch static system messages
    await this.fetchStaticMessages();

    // listen for AIPRM.prompt event from content script
    document.addEventListener('AIPRM.prompt', (event) => {
      this.PrefillPrompt = event.detail.prompt;
    });

    // Bind event handler for arrow keys
    this.boundHandleArrowKey = this.handleArrowKey.bind(this);

    let clientInitialized = false;

    // initialize user based on page props
    if (window?.__NEXT_DATA__?.props?.pageProps?.user?.id) {
      this.Client.User = {
        ExternalID: window.__NEXT_DATA__.props.pageProps.user.id,
        ExternalSystemNo: ExternalSystemNo.OPENAI,
        UserFootprint: '',
        IsLinked: false,
      };
    } else {
      // wait to initialize client - we don't have user ID, yet
      await this.Client.init();

      clientInitialized = true;
    }

    /**
     * Wait for prompt templates, lists, topics, activities, config from remote JSON file,
     * languages, messages and optional client initialization (if not initialized yet)
     */
    await Promise.all([
      this.fetchPromptTemplates(false),
      this.fetchLists(),
      this.fetchTopics(),
      this.fetchActivities(),
      this.fetchConfig(),
      this.fetchLanguages(),
      this.fetchMessages(false),
      this.fetchModels(),
      this.fetchPromptBuilderConfig(),
      clientInitialized ? Promise.resolve() : this.Client.init(),
    ]);

    // Sort lists after fetching of UserTeamM
    this.Lists.sort();

    this.replaceFetch();

    this.createObserver();

    if (
      !this.isMessageShown &&
      !this.Client.UserQuota.connectAccountAnnouncement()
    ) {
      this.showMessages();
    }

    // Preset default CreatePromptMode based on existing or new user
    this.setDefaultCreatePromptMode();

    this.loadPromptTemplateTypeAndListFromLocalStorage();

    this.insertPromptTemplatesSection();

    // Wait for tones, writing styles and continue actions
    await Promise.all([
      this.fetchTones(),
      this.fetchWritingStyles(),
      this.fetchContinueActions(),
      this.fetchMyProfileInfos(),
    ]);

    await this.storeMyProfileInfoFromLocalStorage();

    this.insertLanguageToneWritingStyleContinueActions();
    this.insertIncludeMyProfileInfo();
    this.insertVariablesInputWrapper();

    this.setupSidebar();

    this.fetchPromptFromDeepLink();
    this.prefillPromptInput();

    // on state change (e.g. back button) fetch the prompt from the deep link
    window.addEventListener('popstate', () => {
      this.fetchPromptFromDeepLink();
    });

    // listen for AIPRM.tokens event from AIPRM APP
    document.addEventListener('AIPRM.tokens', async (event) => {
      this.handleTokensEvent(event);
    });

    try {
      // reset hide watermark if user cannot longer use this feature
      if (!this.Client.UserQuota.canUseHideWatermark(false)) {
        localStorage.setItem(hideWatermarkKey, '');
      }
    } catch (error) {
      console.error(error);
    }

    this.addWatermark();

    this.setupFavoritePromptsContextMenu();

    this.addLicenseWarning();
  },

  addLicenseWarning() {
    if (!this.Client.User.LicenseWarning) {
      return;
    }

    const licenseWarningDismissed = localStorage.getItem(
      licenseWarningDismissedKey
    );

    if (licenseWarningDismissed) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (now.getTime() <= licenseWarningDismissed) {
        return;
      }
    }

    const elementID = 'AIPRM-LicenseWarning';
    let element = document.getElementById(elementID);

    // if notification doesn't exist, create it
    if (!element) {
      element = document.createElement('div');
      element.id = elementID;
    }

    const severityClassName = {
      [LicenseWarningLevelNo.WARNING]: 'AIPRM__bg-orange-500',
      [LicenseWarningLevelNo.ERROR]: 'AIPRM__bg-red-500',
    };

    element.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__flex AIPRM__justify-center AIPRM__w-full AIPRM__top-0 AIPRM__z-50 AIPRM__pointer-events-none">
        <div class="${
          severityClassName[this.Client.User.LicenseWarning.WarningLevelNo]
        } AIPRM__w-full AIPRM__justify-center  AIPRM__flex AIPRM__flex-row AIPRM__pointer-events-auto AIPRM__px-6 AIPRM__py-6 AIPRM__text-white" role="alert">
          <div class="AIPRM__flex AIPRM__gap-4">
            <div>
              <p class="AIPRM__max-w-2xl" style="overflow-wrap: anywhere;">${
                this.Client.User.LicenseWarning.Message
              }</p>
            </div>
            <button>${svg('Cross')}</button>
          </div>
        </div>
      </div>
    `;

    // remove element from DOM on click
    element.querySelector('button').addEventListener('click', () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      localStorage.setItem(licenseWarningDismissedKey, now.getTime());

      element.remove();
    });

    document.body.appendChild(element);
  },

  // Preset default create prompt mode based on existing (advanced) or new user (basic)
  setDefaultCreatePromptMode() {
    // Check if the lastPromptTemplateType is set in localStorage
    const lastPromptTemplateType = localStorage.getItem(
      lastPromptTemplateTypeKey
    );

    // If it's not set, then we default to simple mode (new user)
    if (!lastPromptTemplateType || lastPromptTemplateType === '') {
      return;
    }

    // Get the last create prompt mode
    const lastCreatePromptMode = localStorage.getItem(lastCreatePromptModeKey);

    // If it's set and not empty, then we won't change it
    if (lastCreatePromptMode && lastCreatePromptMode !== '') {
      return;
    }

    // If it's not set or it's empty, then we default to advanced mode (existing user)
    localStorage.setItem(lastCreatePromptModeKey, CreatePromptMode.ADVANCED);
  },

  // add prompts from "Favorites" Prompts to context menu
  async setupFavoritePromptsContextMenu() {
    // sync needed also with no prompt IDs to remove favorites from context menu
    const favoritePromptIDs =
      (await this.Lists.getFavorites()?.getPromptIDS()) || [];

    // find favorite prompts
    const favoritePrompts =
      favoritePromptIDs.length === 0
        ? []
        : [
            ...this.PromptTemplates,
            ...this.OwnPrompts,
            ...this.TeamPrompts,
          ].filter((prompt) => favoritePromptIDs.includes(prompt.ID));

    // unique favorite prompts by ID
    let uniqueFavoritePrompts =
      favoritePrompts.length === 0
        ? []
        : favoritePrompts.reduce((acc, prompt) => {
            if (!acc.find((p) => p.ID === prompt.ID)) {
              acc.push(prompt);
            }

            return acc;
          }, []);

    // add _LIVE suffix to ID for context menu actions if template supports live crawling
    uniqueFavoritePrompts = uniqueFavoritePrompts.map((prompt) => ({
      ...prompt,
      ID: this.templateRequiresLiveCrawling(prompt)
        ? `${prompt.ID}_LIVE`
        : prompt.ID,
    }));

    // sort by Title
    uniqueFavoritePrompts.sort((a, b) => a.Title.localeCompare(b.Title));

    // send favorite prompts to content script
    window.postMessage({
      from: 'AIPRM',
      data: {
        type: 'AIPRM.favoritePrompts',
        favoritePrompts: uniqueFavoritePrompts,
      },
    });
  },

  // fetch config from remote JSON file
  async fetchConfig() {
    try {
      const response = await this.fetch(ConfigURL + this.CacheBuster);

      if (!response.ok) {
        throw new Error('Could not fetch config');
      }

      const config = await response.json();

      this.Config = new Config(config);
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * Replace CRAWLEDTEXT/CRAWLEDSOURCE placeholder with live crawled content
   *
   * @param {string} sourceURL - The prompt text (should be URL)
   * @param {string} message - The prompt message with replacement placeholder
   * @returns {Promise<string>} - The prompt message with injected live crawled content
   */
  async injectLiveCrawlingResult(sourceURL, message) {
    // check if message contains CRAWLEDTEXT/CRAWLEDSOURCE placeholder
    if (
      !message.includes(CrawledTextPlaceholder) &&
      !message.includes(CrawledSourcePlaceholder)
    ) {
      return message;
    }

    if (this.SelectedPromptTemplate?.ID) {
      this.Client.usePrompt(
        this.SelectedPromptTemplate.ID,
        UsageTypeNo.LIVE_CRAWLING
      );
    }

    // check if live crawling is enabled
    if (!this.Config.isLiveCrawlingEnabled()) {
      this.showNotification(
        NotificationSeverity.WARNING,
        'Live Crawling is currently disabled. Please try again later.'
      );

      // remove CRAWLEDTEXT/CRAWLEDSOURCE placeholder from message (let ChatGPT to guess at least using the URL)
      return message
        .replace(CrawledTextPlaceholder, '')
        .replace(CrawledSourcePlaceholder, '');
    }

    // check if user can use live crawling
    if (!this.Client.UserQuota.canUseLiveCrawling()) {
      return;
    }

    // trim the whitespace from the URL
    sourceURL = sourceURL ? sourceURL.trim() : sourceURL;

    const content = await this.fetchContent(sourceURL);

    if (!content) {
      throw new Error('No crawled content found');
    }

    // generate GUID using crypto API used to identify the crawled content in the message and prevent prompt injection
    const GUID = crypto.randomUUID();

    // replace CRAWLEDTEXT placeholder with parsed crawled text
    if (message.includes(CrawledTextPlaceholder)) {
      let crawledText = this.parseCrawledText(content, sourceURL);

      crawledText = this.Config.getLiveCrawlingConfig()
        .CrawledTextPrompt.replaceAll('[GUID]', GUID)
        .replaceAll(CrawledTextPlaceholder, crawledText);

      return message.replaceAll(CrawledTextPlaceholder, crawledText);
    }

    // replace CRAWLEDSOURCE placeholder with crawled source
    if (message.includes(CrawledSourcePlaceholder)) {
      const crawledSource = this.limitTextLength(
        content,
        this.Config.getLiveCrawlingConfig().MaxWords,
        this.Config.getLiveCrawlingConfig().MaxCharacters
      );

      this.showNotification(
        NotificationSeverity.SUCCESS,
        `Live Crawling of "${sanitizeInput(
          sourceURL
        )}" finished - submitting prompt ...`
      );

      return message.replaceAll(
        CrawledSourcePlaceholder,
        this.Config.getLiveCrawlingConfig()
          .CrawledSourcePrompt.replaceAll('[GUID]', GUID)
          .replaceAll(CrawledSourcePlaceholder, crawledSource)
      );
    }

    return message;
  },

  /**
   * Parse the HTML content and return the title, excerpt and text content
   *
   * @param {string} content
   * @param {string} URL
   * @returns string
   */
  parseCrawledText(content, URL) {
    // Parse the HTML content
    let doc = new DOMParser().parseFromString(content, 'text/html');

    // Parse the title and excerpt from the HTML content
    let parsed = new window.Readability(doc).parse();

    if (!parsed || !parsed.title || !parsed.excerpt) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Live Crawling of "${sanitizeInput(
          URL
        )}" failed - could not parse content.`
      );

      return;
    }

    // remove excessive new lines and whitespace from textContent and shorten it to max. words & characters with ellipsis
    const textContent =
      this.limitTextLength(
        parsed.textContent,
        this.Config.getLiveCrawlingConfig().MaxWords,
        this.Config.getLiveCrawlingConfig().MaxCharacters
      ) + ' ...';

    this.showNotification(
      NotificationSeverity.SUCCESS,
      `Live Crawling of "${sanitizeInput(
        URL
      )}" finished - submitting prompt ...`
    );

    return `
${parsed.title}

${parsed.excerpt}

${textContent}
`;
  },

  // remove excessive new lines/whitespace and limit the number of words and characters in the text
  limitTextLength(text = '', maxWords = 0, maxCharacters = 0) {
    const words = text
      .replace(/\n{2,}/g, '\n')
      .replace(/\s{2,}/g, ' ')
      .split(/\s+/);

    const limitedWords = words.slice(0, maxWords);

    return limitedWords.join(' ').slice(0, maxCharacters);
  },

  // try to fetch and parse the title and excerpt from the URL using CORS proxy and Readability library
  async fetchContent(sourceURL) {
    if (!sourceURL) {
      this.showNotification(
        NotificationSeverity.WARNING,
        'No URL was found for Live Crawling.'
      );

      return;
    }

    // validate if URL is valid using URL parser
    try {
      new URL(sourceURL);
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'No valid URL was found for Live Crawling.'
      );

      return;
    }

    // doesn't look like a URL
    if (!sourceURL.match(/^(https?:\/\/)/)) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'No valid URL was found for Live Crawling.'
      );

      return;
    }

    let res;

    // Fetch content from the URL
    try {
      this.showNotification(
        NotificationSeverity.INFO,
        `Live Crawling of "${sanitizeInput(sourceURL)}" started ...`,
        false
      );

      res = await fetch(
        this.Config.getLiveCrawlingConfig().APIEndpointURL +
          encodeURIComponent(sourceURL)
      );
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Live Crawling of "${sanitizeInput(
          sourceURL
        )}" failed. Please try again later.`
      );

      return;
    }

    if (!res.ok) {
      console.error('Live Crawling failed', res.status);

      this.showNotification(
        NotificationSeverity.ERROR,
        `Live Crawling of "${sanitizeInput(
          sourceURL
        )}" failed. Please try again later.`
      );

      return;
    }

    this.showNotification(
      NotificationSeverity.INFO,
      `Live Crawling of "${sanitizeInput(
        sourceURL
      )}" finished - parsing content ...`,
      false
    );

    // Get the response text
    return res.text();
  },

  /**
   * Check if the prompt contains placeholders for live crawling
   *
   * @param {Prompt['Prompt']} prompt
   * @returns {boolean}
   */
  promptRequiresLiveCrawling(prompt) {
    return (
      prompt.includes(CrawledTextPlaceholder) ||
      prompt.includes(CrawledSourcePlaceholder)
    );
  },

  /**
   * Check if the template supports live crawling
   *
   * @param {Prompt} template
   * @returns {boolean}
   */
  templateRequiresLiveCrawling(template) {
    return hasFeature(
      template.PromptFeatureBitset,
      PromptFeatureBitset.LIVE_CRAWLING
    );
  },

  // handle AIPRM.tokens event from AIPRM APP
  async handleTokensEvent(event) {
    // store tokens in local storage
    this.Client.storeTokens(event.detail.tokens);

    // link OpenAI user to AIPRM user and account
    try {
      await this.Client.linkUser();
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Could not connect your OpenAI account to AIPRM, please try again later.',
        false
      );

      return;
    }

    try {
      // refresh AIPRM user profile and quota
      await this.Client.checkUserStatus();

      // show notification if connection status is not updated, yet
      if (!this.Client.User.IsLinked) {
        this.showNotification(
          NotificationSeverity.INFO,
          'Connecting your OpenAI account to AIPRM, please wait...',
          false
        );
      }

      // wait for CheckUserStatus to update the connection status, quotas and user profile
      while (!this.Client.User.IsLinked) {
        // poll checkUserStatus every 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 5000));

        await this.Client.checkUserStatus();
      }
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Could not get your AIPRM user profile, please try again later.',
        false
      );

      return;
    }

    // show notification if user is logged in using AIPRM account
    if (this.Client.AppUser) {
      this.showNotification(
        NotificationSeverity.SUCCESS,
        `You are now logged in using AIPRM account "${sanitizeInput(
          this.Client.AppUser.Name
        )} (${sanitizeInput(this.Client.AppUser.Email)})"`,
        false
      );
    }

    // refresh the prompt templates section to show link to AIPRM account
    await this.insertPromptTemplatesSection();
  },

  // get the prompt ID from the URL and select the prompt template
  async fetchPromptFromDeepLink() {
    // Get the prompt ID from the URL (AIPRM_PromptID)
    const params = new URLSearchParams(window.location.search);
    const promptID = params.get(queryParamPromptID);

    if (!promptID) {
      // If there is no prompt ID in the URL - deselect the prompt template
      await this.selectPromptTemplateByIndex(null);

      return;
    }

    // If the prompt is already selected, do nothing
    if (
      this.SelectedPromptTemplate &&
      this.SelectedPromptTemplate.ID === promptID
    ) {
      return;
    }

    let prompt;

    // for correct deep linking of team prompts, use existing team prompt
    const teamPrompt = this.TeamPrompts.find((p) => p.ID === promptID);
    if (teamPrompt) {
      prompt = teamPrompt;
    } else {
      try {
        // Fetch the prompt using the AIPRM API client
        prompt = await this.Client.getPrompt(promptID);
      } catch (error) {
        if (
          error instanceof Reaction &&
          (error.ReactionNo === ReactionNo.RXN_AIPRM_PROMPT_NOT_FOUND ||
            error.ReactionNo === ReactionNo.RXN_AIPRM_INVALID_ID)
        ) {
          this.showNotification(
            NotificationSeverity.WARNING,
            `Requested prompt does not exist.<br><br>Please use the search function to find the prompt you are looking for.`
          );
        } else {
          this.showNotification(
            NotificationSeverity.ERROR,
            'Something went wrong. Please try again.'
          );
        }
        return;
      }
    }

    if (!prompt) {
      return;
    }

    // Select the prompt template
    await this.selectPromptTemplate(prompt);

    // Pre-fill the prompt variables from the URL
    if (prompt.PromptVariables) {
      prompt.PromptVariables.forEach((promptVariable) => {
        const param = params.get(queryParamVariable + promptVariable.ID);
        if (param) {
          const variableElement = document.querySelector(
            '#' + variableIDPrefix + promptVariable.ID
          );

          if (variableElement) {
            variableElement.value = param;
          }
        }
      });
    }
  },

  // Fetch the list of messages from the server
  async fetchMessages(render = true) {
    try {
      this.Messages = await this.Client.getMessages(
        this.PromptTopic === DefaultPromptTopic ? '' : this.PromptTopic
      );
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not load messages. ${
          error instanceof Reaction ? error.message : ''
        }`
      );
      return;
    }

    if (render) {
      this.showMessages();
    }
  },

  /**
   * Display one of the messages
   *
   * @returns {boolean} true if message is shown, false if not
   */
  showMessages() {
    if (this.isMessageShown) {
      return;
    }

    this.isMessageShown = showMessage(
      this.getUnseenStaticMessages(),
      this.Messages,
      this.confirmMessage.bind(this),
      this.voteForMessage.bind(this),
      this.updateLastSeenStaticMessage.bind(this)
    );
  },

  /**
   * Confirm a message using the AIPRM API client
   *
   * @param {string} MessageID
   * @returns {Promise<boolean>} Whether the message was confirmed successfully
   */
  async confirmMessage(MessageID) {
    try {
      await this.Client.confirmMessage(MessageID);
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Something went wrong. Please try again.'
      );
      return false;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      'Thanks for the confirmation!'
    );

    this.isMessageShown = false;

    return true;
  },

  /**
   * Vote for a message using the AIPRM API client
   *
   * @param {string} MessageID
   * @param {MessageVoteTypeNo} VoteTypeNo
   * @returns boolean Whether the message was voted for successfully
   */
  async voteForMessage(MessageID, VoteTypeNo) {
    try {
      await this.Client.voteForMessage(MessageID, VoteTypeNo);
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Something went wrong. Please try again.'
      );
      return false;
    }

    this.isMessageShown = false;

    return true;
  },

  /**
   * Update last seen static message using localStorage
   *
   * @param {string} MessageID
   * @returns boolean Whether the last seen static message was updated successfully
   */
  updateLastSeenStaticMessage(MessageID) {
    try {
      localStorage.setItem(lastSeenStaticMessageKey, MessageID);
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Something went wrong. Please try again.'
      );
      return false;
    }

    this.isMessageShown = false;

    return true;
  },

  // This function sets up the chat sidebar by adding an "Export Button" and modifying
  // the "New Chat" buttons to clear the selected prompt template when clicked
  setupSidebar() {
    // Add the "Export Button" to the sidebar
    this.addExportButton();
    // Get the "New Chat" buttons
    const buttons = this.getNewChatButtons();
    // Set the onclick event for each button to clear the selected prompt template
    buttons.forEach((button) => {
      button.onclick = async () => {
        await this.selectPromptTemplateByIndex(null);

        // Hide the "Continue Writing" button (no prompt selected/new chat)
        this.hideContinueActionsButton();
      };
    });
  },

  // Fetch the lists using the AIPRM API client
  async fetchLists() {
    try {
      const lists = await this.Client.getAllListsWithDetails();

      this.Lists = new Lists(
        lists.map((list) => {
          return new List(this.Client, list);
        })
      );
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not load the prompts lists. ${
          error instanceof Reaction ? error.message : ''
        }`
      );
      return;
    }
  },

  // Fetch the list of topics from a remote CSV file
  async fetchTopics() {
    return (
      this.fetch(TopicFeedURL + this.CacheBuster)
        // Convert the response to text
        .then((res) => res.text())
        // Convert the CSV text to an array of records
        .then((csv) => this.CSVToArray(csv))
        // Map the records to topic objects with properties 'ID' and 'Label'
        .then((records) => {
          return (
            records
              .map(([ID, Label]) => {
                return { ID, Label };
              })
              // Filter out records that do not have an ID, or it is the header row (with "ID" as its title)
              .filter(({ ID }) => ID && ID !== 'ID')
          );
        })
        .then((topics) => {
          // Sort and save the topics
          this.Topics = topics.sort((a, b) => a.Label.localeCompare(b.Label));
        })
    );
  },

  // Fetch the list of activities from a remote CSV file
  async fetchActivities() {
    return (
      this.fetch(ActivityFeedURL + this.CacheBuster)
        // Convert the response to text
        .then((res) => res.text())
        // Convert the CSV text to an array of records
        .then((csv) => this.CSVToArray(csv))
        // Map the records to activity objects with properties 'TopicID', 'ID', and 'Label'
        .then((records) => {
          return (
            records
              .map(([TopicID, ID, Label]) => {
                return { TopicID, ID, Label };
              })
              // Filter out records that do not have an ID, or it is the header row (with "ID" as its title)
              .filter(({ ID }) => ID && ID !== 'ID')
          );
        })
        .then((activities) => {
          // Sort and save the array of activities
          this.Activities = activities.sort((a, b) =>
            a.Label.localeCompare(b.Label)
          );
        })
    );
  },

  fetchLanguages() {
    // Fetch the list of languages from a remote CSV file
    return (
      this.fetch(LanguageFeedURL + this.CacheBuster)
        // Convert the response to text
        .then((res) => res.text())
        // Convert the CSV text to an array of records
        .then((csv) => this.CSVToArray(csv))
        // Map the records to language objects with properties 'langcode', 'languageEnglish' and 'languageLabel'
        .then((records) => {
          return (
            records
              .map(([langcode, languageEnglish, languageLabel]) => {
                return { langcode, languageEnglish, languageLabel };
              })
              // Filter out records that do not have a language code, or it is the header row (with "langcode" as its title)
              .filter(({ langcode }) => langcode && langcode !== 'langcode')
          );
        })
        .then((languages) => {
          // Save the array of languages to a global variable
          this.Languages = languages;
        })
    );
  },

  // Fetch list of tones from a remote CSV file
  fetchTones() {
    // use custom tones from AccountSubPrompts
    /** @type {Tone[]} */
    const customTones = this.Client.AccountSubPrompts
      // filter out prompts that are not custom tones
      .filter((prompt) => prompt.TypeNo === SubPromptTypeNo.CustomTones)
      // map the prompts to tones
      .map((prompt) => {
        return {
          ID: parseInt(prompt.PromptID),
          Label: prompt.Label,
        };
      });

    // if there are custom tones, combine them with the default tones
    if (customTones.length > 0) {
      this.Tones = customTones;
    }

    return (
      this.fetch(ToneFeedURL + this.CacheBuster)
        // Convert the response to text
        .then((res) => res.text())
        // Convert the CSV text to an array of records
        .then((csv) => this.CSVToArray(csv))
        // Map the records to tone objects with properties 'ID' and 'Label'
        .then((records) => {
          return (
            records
              .map(([ID, Label]) => {
                return { ID: parseInt(ID), Label };
              })
              // Filter out records that do not have an ID, or it is the header row (with "ID" as its title)
              .filter(({ ID }) => ID && ID !== 'ID')
          );
        })
        .then((tones) => {
          // Append the default tones to the custom tones and sort the tones by Label
          this.Tones = [...this.Tones, ...tones].sort((a, b) =>
            a.Label.localeCompare(b.Label)
          );
        })
    );
  },

  // Fetch list of writing styles from a remote CSV file
  fetchWritingStyles() {
    // use custom writing styles from AccountSubPrompts
    /** @type {WritingStyle[]} */
    const customWritingStyles = this.Client.AccountSubPrompts
      // filter out prompts that are not custom writing styles
      .filter((prompt) => prompt.TypeNo === SubPromptTypeNo.CustomStyles)
      // map the prompts to writing styles
      .map((prompt) => {
        return {
          ID: parseInt(prompt.PromptID),
          Label: prompt.Label,
        };
      });

    // if there are custom writing styles, combine them with the default writing styles
    if (customWritingStyles.length > 0) {
      this.WritingStyles = customWritingStyles;
    }

    return (
      this.fetch(WritingStyleFeedURL + this.CacheBuster)
        // Convert the response to text
        .then((res) => res.text())
        // Convert the CSV text to an array of records
        .then((csv) => this.CSVToArray(csv))
        // Map the records to writing style objects with properties 'ID' and 'Label'
        .then((records) => {
          return (
            records
              .map(([ID, Label]) => {
                return { ID: parseInt(ID), Label };
              })
              // Filter out records that do not have an ID, or it is the header row (with "ID" as its title)
              .filter(({ ID }) => ID && ID !== 'ID')
          );
        })
        .then((writingStyles) => {
          // Append the default writing styles to the custom writing styles and sort the writing styles by Label
          this.WritingStyles = [...this.WritingStyles, ...writingStyles].sort(
            (a, b) => a.Label.localeCompare(b.Label)
          );
        })
    );
  },

  // Fetch list of continue actions from a remote CSV file
  fetchContinueActions() {
    // use custom continue actions from AccountSubPrompts
    /** @type {ContinueAction[]} */
    const customContinueActions = this.Client.AccountSubPrompts
      // filter out prompts that are not custom continue actions
      .filter((prompt) => prompt.TypeNo === SubPromptTypeNo.CustomContinue)
      // map the prompts to continue actions
      .map((prompt) => {
        return {
          ID: parseInt(prompt.PromptID),
          Label: prompt.Label,
          Prompt: prompt.Prompt,
        };
      });

    // if there are custom continue actions, combine them with the default continue actions
    if (customContinueActions.length > 0) {
      this.ContinueActions = customContinueActions;
    }

    return (
      this.fetch(ContinueActionsFeedURL + this.CacheBuster)
        // Convert the response to text
        .then((res) => res.text())
        // Convert the CSV text to an array of records
        .then((csv) => this.CSVToArray(csv))
        // Map the records to continue action objects with properties 'ID', 'Label, and 'Prompt'
        .then((records) => {
          return (
            records
              .map(([ID, Label, Prompt]) => {
                return { ID: parseInt(ID), Label, Prompt };
              })
              // Filter out records that do not have an ID, or it is the header row (with "ID" as its title)
              .filter(({ ID }) => ID && ID !== 'ID')
          );
        })
        .then((continueActions) => {
          // Append the default continue actions to the custom continue actions and sort the continue actions by Label
          this.ContinueActions = [
            ...this.ContinueActions,
            ...continueActions,
          ].sort((a, b) => a.Label.localeCompare(b.Label));
        })
    );
  },

  // Fetch list of my profile infos from AccountSubPrompts
  fetchMyProfileInfos() {
    /** @type {MyProfileInfo[]} */
    this.MyProfileInfos = this.Client.AccountSubPrompts
      // filter out prompts that are not MyProfileInfo
      .filter((prompt) => prompt.TypeNo === SubPromptTypeNo.MyProfileInfo)
      // map the prompts to MyProfileInfos
      .map((prompt) => {
        return {
          ID: parseInt(prompt.PromptID),
          Label: prompt.Label,
          Info: prompt.Prompt,
        };
      })
      // sort the MyProfileInfos by Label
      .sort((a, b) => a.Label.localeCompare(b.Label));

    // reset includeMyProfileInfo if there are no custom MyProfileInfos
    if (this.MyProfileInfos.length === 0) {
      this.resetIncludeMyProfileInfo();
    }
  },

  // If MyProfileInfo is store in local storage, then store it in backend and remove it from local storage
  async storeMyProfileInfoFromLocalStorage() {
    // cannot store MyProfileInfo if user is not linked
    if (!this.Client.User.IsLinked) {
      return;
    }

    try {
      const myProfileInfo = localStorage.getItem(myProfileMessageKey);

      // if there is no myProfileInfo in local storage, then return
      if (!myProfileInfo) {
        return;
      }

      // create MyProfileInfo
      const subPrompt = await this.Client.createMyProfileInfo(myProfileInfo);

      // add created MyProfileInfo to this.MyProfileInfos
      this.MyProfileInfos.push({
        ID: parseInt(subPrompt.PromptID),
        Label: subPrompt.Label,
        Info: subPrompt.Prompt,
      });

      // remove the old myProfileInfo from local storage
      localStorage.removeItem(myProfileMessageKey);
    } catch (error) {
      // user has reached the limit of max. MyProfileInfos quota
      if (
        error instanceof Reaction &&
        error.ReactionNo === ReactionNo.RXN_AIPRM_QUOTA_EXCEEDED
      ) {
        // remove the old myProfileInfo from local storage
        localStorage.removeItem(myProfileMessageKey);

        return;
      }

      console.error(error);
    }
  },

  // Fetch list of models from a remote CSV file
  fetchModels() {
    return (
      this.fetch(ModelFeedURL + this.CacheBuster)
        // Convert the response to text
        .then((res) => res.text())
        // Convert the CSV text to an array of records
        .then((csv) => this.CSVToArray(csv))
        // Map the records to model objects with properties 'ID' and 'Label'
        .then((records) => {
          return (
            records
              .map(([ID, LabelUser, LabelAuthor, StatusNo]) => {
                return {
                  ID: ID,
                  LabelUser,
                  LabelAuthor,
                  StatusNo: parseInt(StatusNo),
                };
              })
              // Filter out records that do not have an ID, or it is the header row (with "ID" as its title)
              .filter(({ ID }) => ID && ID !== 'ID')
          );
        })
        .then((models) => {
          // sort the models by Label
          this.Models = models.sort((a, b) =>
            a.LabelAuthor.localeCompare(b.LabelAuthor)
          );

          // filter out models that are not active
          this.ModelsActive = this.Models.filter(
            (model) => model.StatusNo === ModelStatusNo.ACTIVE
          );
        })
    );
  },

  // Fetch list roles, tasks, constraints and contexts for prompt builder config from a remote CSV file
  fetchPromptBuilderConfig() {
    const options = {
      roles: [],
      tasks: [],
      constraints: [],
      contexts: [],
    };

    return (
      this.fetch(PromptBuilderFeedURL + this.CacheBuster)
        // Convert the response to text
        .then((res) => res.text())
        // Convert the CSV text to an array of records
        .then((csv) => this.CSVToArray(csv))
        // Map the records to prompt builder options (roles, tasks, constraints and contexts) - ignore header "Type","Label"
        .then((records) => {
          return (
            records
              .map(([Type, Label]) => {
                return { Type, Label };
              })
              // Filter out records that do not have a Type, or it is the header row (with "Type" as its title)
              .filter(({ Type }) => Type && Type !== 'Type')
          );
        })
        .then((promptBuilderOptions) => {
          // collect prompt builder options (roles, tasks, constraints and contexts)
          promptBuilderOptions.forEach((option) => {
            switch (option.Type) {
              case 'role':
                options.roles.push(option.Label);
                break;
              case 'task':
                options.tasks.push(option.Label);
                break;
              case 'constraint':
                options.constraints.push(option.Label);
                break;
              case 'context':
                options.contexts.push(option.Label);
                break;
            }
          });
        })
        .then(() => {
          // sort the prompt builder options (roles, tasks, constraints and contexts) by Label in a case-insensitive manner
          options.roles.sort((a, b) =>
            a.toLowerCase().localeCompare(b.toLowerCase())
          );
          options.tasks.sort((a, b) =>
            a.toLowerCase().localeCompare(b.toLowerCase())
          );
          options.constraints.sort((a, b) =>
            a.toLowerCase().localeCompare(b.toLowerCase())
          );
          options.contexts.sort((a, b) =>
            a.toLowerCase().localeCompare(b.toLowerCase())
          );
        })
        .then(() => {
          // save the prompt builder options (roles, tasks, constraints and contexts)
          this.PromptBuilderOptions = options;
        })
    );
  },

  // Load Prompt Templates type and list ID from local storage
  loadPromptTemplateTypeAndListFromLocalStorage() {
    const lastPromptTemplateType = localStorage.getItem(
      lastPromptTemplateTypeKey
    );
    const lastListID = localStorage.getItem(lastListIDKey);

    let matched = false;

    switch (lastPromptTemplateType) {
      // Public or Own Prompt Templates
      case PromptTemplatesType.PUBLIC:
      case PromptTemplatesType.OWN:
        matched = true;
        this.PromptTemplatesType = lastPromptTemplateType;
        this.PromptTemplatesList = null;
        break;

      // Custom List Prompt Templates
      case PromptTemplatesType.CUSTOM_LIST:
        // Check if the last list ID is valid, exists and the user can use it
        if (
          lastListID &&
          // Hidden List
          ((lastListID == this.Lists.getHidden()?.ID &&
            this.Client.UserQuota.canUseHiddenOnlyCheck()) ||
            // Favorites List
            (lastListID == this.Lists.getFavorites()?.ID &&
              this.Client.UserQuota.canUseFavoritesOnlyCheck()) ||
            // AIPRM Verified List
            (lastListID == this.Lists.getAIPRMVerified()?.ID &&
              this.Client.UserQuota.canUseAIPRMVerifiedList(false)) ||
            // Custom List
            (this.Lists.withIDAndType(lastListID, ListTypeNo.CUSTOM) &&
              this.Client.UserQuota.canUseCustomListOnlyCheck()) ||
            // Team List
            (this.Lists.withIDAndType(lastListID, ListTypeNo.TEAM_CUSTOM) &&
              this.Client.UserQuota.canUseTeamListOnlyCheck()))
        ) {
          matched = true;
          this.PromptTemplatesType = PromptTemplatesType.CUSTOM_LIST;
          this.PromptTemplatesList = lastListID;
        }
        break;
    }

    if (!matched) {
      this.PromptTemplatesType = PromptTemplatesType.PUBLIC;
      this.PromptTemplatesList = null;

      localStorage.setItem(lastPromptTemplateTypeKey, this.PromptTemplatesType);
      localStorage.setItem(lastListIDKey, this.PromptTemplatesList);
    }
  },

  async fetchPromptTemplates(render = true) {
    let templates;

    try {
      /** @type {Prompt[]} */
      templates = await this.Client.getPrompts(
        this.PromptTopic === DefaultPromptTopic ? '' : this.PromptTopic,
        this.PromptSortMode
      );
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not load prompt templates. ${
          error instanceof Reaction ? error.message : ''
        }`
      );
      return;
    }

    // split templates into public, own and team
    [this.PromptTemplates, this.OwnPrompts, this.TeamPrompts] =
      templates.reduce(
        (publicPrivateTeamPrompts, template) => {
          // Public template
          if (
            template.PromptTypeNo === PromptTypeNo.PUBLIC &&
            (this.PromptTopic === DefaultPromptTopic ||
              template.Community === this.PromptTopic)
          ) {
            publicPrivateTeamPrompts[0].push(template);
          }

          // Private, Team or Public template owned by current user
          if (
            template.OwnPrompt &&
            (this.PromptTopic === DefaultPromptTopic ||
              template.Community === this.PromptTopic)
          ) {
            publicPrivateTeamPrompts[1].push(template);
          }

          // Team templates - we need to have all TeamPrompts in this array
          if (template.PromptTypeNo === PromptTypeNo.TEAM) {
            publicPrivateTeamPrompts[2].push(template);
          }

          return publicPrivateTeamPrompts;
        },
        [[], [], []]
      );

    if (render) {
      await this.insertPromptTemplatesSection();
    }
  },

  /**
   * Check if a template is for model
   *
   * @param {Prompt} template
   * @param {string} modelID
   * @returns {boolean}
   */
  isTemplateForModel(template, modelID) {
    if (template.ModelS?.find((model) => model === modelID)) {
      return true;
    } else {
      return false;
    }
  },

  createObserver() {
    // Create a new observer for the chat sidebar to watch for changes to the document body
    const observer = new MutationObserver((mutations) => {
      // For each mutation (change) to the document body
      mutations.forEach(async (mutation) => {
        // If the mutation is not a change to the list of child nodes, skip it
        if (mutation.type !== 'childList')
          if (mutation.addedNodes.length == 0)
            // If no new nodes were added, skip this mutation
            return;
        // Get the first added node
        const node = mutation.addedNodes[0];
        // If the node is not an element or does not have a `querySelector` method, skip it
        if (!node || !node.querySelector) return;
        // Call the `handleElementAdded` function with the added node
        await this.handleElementAdded(node);
      });
    });

    // Start observing the document body for changes
    observer.observe(document.body, { subtree: true, childList: true });
  },

  // Find the message part index in parts array (skip image for multimodal_text content type)
  findMessagePartIndex(message) {
    // default message part index is 0 for the first prompt
    if (message?.content?.content_type !== 'multimodal_text') {
      return 0;
    }

    // find the message part index for multimodal_text content type (skip one or multiple images)
    for (let i = 0; i < message?.content?.parts?.length; i++) {
      // if the value is not object, then return the index
      if (typeof message?.content?.parts[i] !== 'object') {
        return i;
      }
    }

    // if the message part is not found show an error
    this.showNotification(
      NotificationSeverity.ERROR,
      'Could not modify prompt - no message part found'
    );

    throw new Error('Could not modify prompt - no message part found');
  },

  replaceFetch() {
    window.fetch = async (...t) => {
      // If the request is not for the chat backend API, just use the original fetch function
      if (t[0] !== EndpointConversation) return this.fetch(...t);

      // If no prompt template, tone, writing style or target language has been selected,
      // use only the profile message or the original fetch function if the profile message is not needed
      if (
        !this.SelectedPromptTemplate &&
        !this.Tone &&
        !this.WritingStyle &&
        !this.TargetLanguage
      ) {
        // Use profile message if needed - otherwise, use the original fetch function
        if (!this.IncludeMyProfileMessage || !this.SelectedMyProfileInfoID) {
          // Reset the includeMyProfileInfo
          this.resetIncludeMyProfileInfo();

          return this.fetch(...t);
        }

        try {
          // Get the options object for the request, which includes the request body
          const options = t[1];

          // Parse the request body from JSON
          const body = JSON.parse(options.body);

          // Get the index of the message part in the request body
          const messagePartIndex = this.findMessagePartIndex(body.messages[0]);

          const myProfileInfo = this.MyProfileInfos
            ? this.MyProfileInfos.find(
                (myProfileInfo) =>
                  myProfileInfo.ID === this.SelectedMyProfileInfoID
              )
            : null;

          if (myProfileInfo) {
            // Add the profile message to the request body
            body.messages[0].content.parts[
              messagePartIndex
            ] += `\n\n${myProfileInfo.Info}`;
          }

          // Reset the includeMyProfileInfo
          this.resetIncludeMyProfileInfo();

          // Stringify the modified request body and update the options object
          options.body = JSON.stringify(body);

          // Use the modified fetch function to make the request
          return this.fetch(t[0], options);
        } catch (err) {
          console.error('Error modifying request body', err);

          // If there was an error parsing the request body or modifying the request,
          // just use the original fetch function
          return this.fetch(...t);
        }
      }

      // Get the selected prompt template
      const template = this.SelectedPromptTemplate;

      if (template) {
        this.Client.usePrompt(template.ID, UsageTypeNo.SEND);
      }

      // Allow the user to use continue actions after sending a prompt
      this.showContinueActionsButton();

      try {
        // Get the options object for the request, which includes the request body
        const options = t[1];
        // Parse the request body from JSON
        const body = JSON.parse(options.body);

        // Get the index of the message part in the request body
        const messagePartIndex = this.findMessagePartIndex(body.messages[0]);

        if (template) {
          // Get the prompt from the request body
          const prompt = body.messages[0].content.parts[messagePartIndex];

          // Use the default target language if no target language has been selected
          const targetLanguage = (
            this.TargetLanguage ? this.TargetLanguage : DefaultTargetLanguage
          ).replace('*', '');

          // Replace the prompt in the request body with the selected prompt template,
          // inserting the original prompt into the template and replacing the target language placeholder
          let promptTextUpdated = template.Prompt.replaceAll(
            PromptPlaceholder,
            prompt
          ).replaceAll(TargetLanguagePlaceholder, targetLanguage);

          // Replace variables with values
          if (template.PromptVariables) {
            template.PromptVariables.forEach((promptVariable) => {
              const v = document.querySelector(
                '#' + variableIDPrefix + promptVariable.ID
              );
              if (v) {
                promptTextUpdated = promptTextUpdated.replaceAll(
                  VariablePlaceholder.replace('{idx}', promptVariable.ID),
                  v.value
                );
              }
            });
          }

          // Remove variable definitions from prompt text
          promptTextUpdated = promptTextUpdated.replaceAll(
            VariableDefinition,
            ''
          );

          body.messages[0].content.parts[messagePartIndex] = promptTextUpdated;

          // Replace Live Crawling placeholders with the Live Crawling result
          body.messages[0].content.parts[messagePartIndex] =
            await this.injectLiveCrawlingResult(
              prompt,
              body.messages[0].content.parts[messagePartIndex]
            );
        }

        /** @type {string[]} */
        const toneWritingStyleLanguagePrompt = [];

        // If the user has selected a tone, add it to the request body
        const tone = this.Tone
          ? this.Tones.find((tone) => tone.ID === this.Tone)
          : null;

        if (tone) {
          toneWritingStyleLanguagePrompt.push(
            `${tone.Label.toLowerCase()} tone`
          );

          // Track the tone usage
          this.Client.usePrompt(`${tone.ID}`, UsageTypeNo.SEND);
        }

        // If the user has selected a writing style, add it to the request body
        const writingStyle = this.WritingStyle
          ? this.WritingStyles.find(
              (writingStyle) => writingStyle.ID === this.WritingStyle
            )
          : null;

        if (writingStyle) {
          toneWritingStyleLanguagePrompt.push(
            `${writingStyle.Label.toLowerCase()} writing style`
          );

          // Track the writing style usage
          this.Client.usePrompt(`${writingStyle.ID}`, UsageTypeNo.SEND);
        }

        // If the user has selected a target language, add it to the request body
        if (!template && this.TargetLanguage) {
          toneWritingStyleLanguagePrompt.push(
            `${this.TargetLanguage.replace('*', '')} language`
          );
        }

        // Inject profile message into the request body if available
        if (this.IncludeMyProfileMessage && this.SelectedMyProfileInfoID) {
          const myProfileInfo = this.MyProfileInfos
            ? this.MyProfileInfos.find(
                (myProfileInfo) =>
                  myProfileInfo.ID === this.SelectedMyProfileInfoID
              )
            : null;

          if (myProfileInfo) {
            body.messages[0].content.parts[
              messagePartIndex
            ] += `\n\n${myProfileInfo.Info}`;
          }

          // Reset the includeMyProfileInfo
          this.resetIncludeMyProfileInfo();
        }

        // If the user has selected a tone, writing style or target language, add a prompt to the request body
        if (toneWritingStyleLanguagePrompt.length > 0) {
          body.messages[0].content.parts[
            messagePartIndex
          ] += `\n\nPlease write in ${toneWritingStyleLanguagePrompt.join(
            ', '
          )}.`;
        }

        // Clear the selected prompt template
        await this.selectPromptTemplateByIndex(null);

        // Stringify the modified request body and update the options object
        options.body = JSON.stringify(body);
        // Use the modified fetch function to make the request
        return this.fetch(t[0], options);
      } catch (err) {
        console.error('Error modifying request body', err);

        // If there was an error parsing the request body or modifying the request,
        // just use the original fetch function
        return this.fetch(...t);
      }
    };
  },

  // Add AIPRM watermark to conversation responses
  addWatermark() {
    // no config available or watermark is not enabled or watermark is hidden by user settings
    if (
      !this.Config ||
      !this.Config.isWatermarkEnabled() ||
      this.getHideWatermark()
    ) {
      return;
    }

    const watermarkConfig = this.Config.getWatermarkConfig();

    // add watermark class to all configured selectors, if it's not set, yet
    Object.keys(watermarkConfig.Selectors).forEach((watermarkClass) => {
      document
        .querySelectorAll(
          `${
            watermarkConfig.Selectors[watermarkClass]
          }:not(.${watermarkClass.replace(/:/g, '\\:')})`
        )
        .forEach((element) => {
          element.classList.add(watermarkClass);
        });
    });
  },

  // This function is called for each new element added to the document body
  async handleElementAdded(e) {
    const selectorConfig = this.Config.getSelectorConfig();

    // If watermark is enabled, add corresponding classes
    this.addWatermark();

    // If the element added is the root element for the chat sidebar, set up the sidebar
    if (
      e.id === selectorConfig.ElementAddedSidebarID1 ||
      e.id === selectorConfig.ElementAddedSidebarID2
    ) {
      this.setupSidebar();
      return;
    }

    // Disable "Export Button" when no chat were started.
    // Insert "Prompt Templates" section to the main page.
    // Insert language select and continue button above the prompt textarea input
    if (e.querySelector(selectorConfig.ElementAddedExportButtonDisable)) {
      await this.insertPromptTemplatesSection();

      const button = document.getElementById('export-button');
      if (button) button.style = 'pointer-events: none;opacity: 0.5';

      this.insertLanguageToneWritingStyleContinueActions();
      this.insertIncludeMyProfileInfo();
    }

    // Enable "Export Button" when a new chat started.
    // Insert language select and continue button above the prompt textarea input
    if (document.querySelector(selectorConfig.ElementAddedExportButtonEnable)) {
      const button = document.getElementById('export-button');
      if (button) button.style = '';

      this.insertLanguageToneWritingStyleContinueActions();
      this.insertIncludeMyProfileInfo();
    }

    // Add "Save prompt as template" button, if new prompt was added
    if (
      document.querySelector(selectorConfig.ElementAddedSavePromptAsTemplate)
    ) {
      this.insertSavePromptAsTemplateButton();

      this.insertPromptTemplatesSidebar();
    }

    // Hide suggested prompts conflicting with prompt templates
    this.hideSuggestedPrompts();

    // Apply general layout changes based on config
    this.applyLayoutChanges();
  },

  // Apply layout changes based on config and type (general or specific only)
  applyLayoutChanges(type = LayoutChangeType.GENERAL) {
    const layoutChanges = this.Config.getLayoutChangesConfig()?.[type] || [];

    // Apply layout changes (query using "Selector" property, "Remove" to remove classes, "Add" to add classes)
    layoutChanges.forEach((layoutChange) => {
      const elements = document.querySelectorAll(layoutChange.Selector);

      elements.forEach((element) => {
        if (layoutChange.Remove?.length > 0) {
          element.classList.remove(...layoutChange.Remove);
        }

        if (layoutChange.Add?.length > 0) {
          element.classList.add(...layoutChange.Add);
        }
      });
    });
  },

  // Check if the there are suggested prompts and hide them
  hideSuggestedPrompts() {
    const selectorConfig = this.Config.getSelectorConfig();

    const suggestedPrompts = document.querySelector(
      selectorConfig.SuggestedPrompts
    );

    // No suggested prompts found
    if (!suggestedPrompts) {
      return;
    }

    // Check if it's conversation page, because otherwise the "Regenerate" button would be hidden, too
    const isConversationPage =
      document.querySelector(selectorConfig.ConversationResponse) ||
      document.querySelector(selectorConfig.FirstPrompt);

    // Add class AIPRM__hidden to the suggested prompts in case it's not conversation page, otherwise remove it
    isConversationPage
      ? suggestedPrompts.classList.remove('AIPRM__hidden')
      : suggestedPrompts.classList.add('AIPRM__hidden');
  },

  // Add AIPRM sidebar icon and sidebar with prompt templates
  insertPromptTemplatesSidebar() {
    // Add icon for sidebar if not present, yet
    let sidebarIcon = document.getElementById('AIPRM__sidebar-icon');

    // Add sidebar icon and sidebar if not present, yet
    if (sidebarIcon) {
      return;
    }

    this.updateShareButton();

    // Display sidebar icon only in new and existing conversations
    const selectorConfig = this.Config.getSelectorConfig();

    if (
      !document.querySelector(selectorConfig.ConversationResponse) &&
      !document.querySelector(selectorConfig.FirstPrompt)
    ) {
      return;
    }

    sidebarIcon = document.createElement('div');
    sidebarIcon.id = 'AIPRM__sidebar-icon';

    sidebarIcon.className =
      'AIPRM__p-2 AIPRM__top-12 md:AIPRM__top-2 AIPRM__p-2 AIPRM__items-center AIPRM__transition-colors AIPRM__duration-200 AIPRM__cursor-pointer AIPRM__text-sm AIPRM__rounded-md AIPRM__border AIPRM__bg-white dark:AIPRM__bg-gray-800 AIPRM__border-black/10 dark:AIPRM__border-white/20 hover:AIPRM__bg-gray-50 dark:hover:AIPRM__bg-gray-700 AIPRM__cursor-pointer AIPRM__fixed AIPRM__right-4 AIPRM__z-30';

    sidebarIcon.title = 'Open AIPRM sidebar';

    sidebarIcon.innerHTML =
      /*html*/ '<div class="AIPRM__invert dark:AIPRM__filter-none AIPRM__sidebar-icon AIPRM__w-12 AIPRM__h-12"></div>';

    // Add click event listener to open/close sidebar
    sidebarIcon.addEventListener('click', () => {
      const sidebar = document.getElementById('AIPRM__sidebar');
      const sidebarOpen = sidebar.classList.contains('AIPRM__translate-x-0');

      // hide icon when sidebar is open
      sidebarIcon.style = !sidebarOpen ? 'display: none;' : '';

      // animate opening and closing of sidebar
      sidebar.classList.toggle('AIPRM__translate-x-0');
      sidebar.classList.toggle('AIPRM__translate-x-full');

      // add prompt templates section to sidebar
      this.insertPromptTemplatesSection();
    });

    // Prepare sidebar element with sidebar icon and prompt templates section
    const sidebar = document.createElement('div');
    sidebar.id = 'AIPRM__sidebar';

    sidebar.className =
      '2xl:AIPRM__w-7/12 lg:AIPRM__w-3/4 md:AIPRM__w-11/12 AIPRM__w-full AIPRM__h-full AIPRM__bg-white AIPRM__text-gray-700 AIPRM__shadow-lg AIPRM__absolute AIPRM__right-0 AIPRM__overflow-auto AIPRM__z-20 dark:AIPRM__bg-gray-800 dark:AIPRM__text-white AIPRM__ease-in-out AIPRM__duration-300 AIPRM__translate-x-full';

    sidebar.innerHTML = /*html*/ `
          <div class="AIPRM__relative" title="Close AIPRM sidebar" id="AIPRM__sidebar-container">
            <div class="AIPRM__p-2 AIPRM__items-center AIPRM__transition-colors AIPRM__duration-200 AIPRM__cursor-pointer AIPRM__text-sm AIPRM__rounded-md AIPRM__border AIPRM__bg-white dark:AIPRM__bg-gray-800 AIPRM__border-black/10 dark:AIPRM__border-white/20 hover:AIPRM__bg-gray-50 dark:hover:AIPRM__bg-gray-700 AIPRM__absolute AIPRM__top-0 AIPRM__left-4 AIPRM__z-30" onclick="document.getElementById('AIPRM__sidebar-icon').click()">
              <div class="AIPRM__invert dark:AIPRM__filter-none AIPRM__sidebar-icon AIPRM__w-12 AIPRM__h-12"></div>
            </div>

            <h1 style="display: none;" class="text-4xl"></h1>
          </div>
        `;

    // Add sidebar icon and sidebar to the page
    document.querySelector(selectorConfig.Sidebar).appendChild(sidebarIcon);
    document.querySelector(selectorConfig.Sidebar).appendChild(sidebar);
  },

  updateShareButton() {
    const shareButtonSection = document.querySelector(
      this.Config.getSelectorConfig().ShareButton
    );

    if (!shareButtonSection) {
      return;
    }

    shareButtonSection.classList.add('AIPRM__share-button');
  },

  // Add "Save prompt as template" button to the user prompt container next to the "Edit" button
  insertSavePromptAsTemplateButton() {
    const selectorConfig = this.Config.getSelectorConfig();

    // get the first prompt
    const firstPrompt = document.querySelector(selectorConfig.FirstPrompt);

    if (!firstPrompt) {
      return;
    }

    // get parent element of the first prompt to find the "Edit" button
    // select only buttons that do not contain image with alt "Uploaded image"
    const buttons = firstPrompt.parentElement.parentElement.querySelectorAll(
      selectorConfig.FirstPromptButtons
    );

    if (!buttons || buttons.length === 0) {
      return;
    }

    // get the "Edit" button (last button in the list)
    const button = buttons[buttons.length - 1];

    if (!button) {
      return;
    }

    // Allow user to continue writing from chat history
    this.showContinueActionsButton();

    let saveButton = button.parentElement.querySelector('.save-prompt-button');

    // if button already exists, skip
    if (saveButton) {
      return;
    }

    saveButton = document.createElement('button');
    saveButton.className =
      'save-prompt-button AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400 md:AIPRM__invisible md:group-hover:AIPRM__visible md:group-hover:visible';
    saveButton.title = 'Save prompt as template';
    saveButton.addEventListener('click', this.createNewPrompt.bind(this));
    saveButton.innerHTML = svg('Save');

    // add HTML before children in button.parentElement
    button.parentElement.prepend(saveButton);
  },

  // get all available activities for the selected topic
  getActivities(TopicID = DefaultPromptTopic) {
    const currentActivities = this.Activities.filter(
      (activity) =>
        !TopicID ||
        TopicID === DefaultPromptTopic ||
        activity.TopicID === TopicID
    );

    // keep only unique activity.Label and extract activity.ID and activity.Label
    return [
      ...new Set(currentActivities.map((activity) => activity.Label)),
    ].map((label) => ({
      ID: this.Activities.find((activity) => activity.Label === label).ID,
      Label: label,
    }));
  },

  /**
   * Validate prompt template before saving
   *
   * @param {Prompt} prompt
   * @param {CreatePromptMode} currentCreatePromptMode
   * @returns {boolean} true if prompt is valid
   */
  validatePrompt(prompt, currentCreatePromptMode) {
    const errors = [];

    // find existing prompt based on ID in PromptTemplates or OwnPrompts
    const existingPrompt = [...this.PromptTemplates, ...this.OwnPrompts].find(
      (p) => p.ID === prompt.ID
    );

    // prompt type was changed between public and private
    const promptTypeChanged =
      existingPrompt && existingPrompt.PromptTypeNo !== prompt.PromptTypeNo;

    // current user cannot create any prompt template, but can edit existing prompt
    if (!this.canCreatePromptTemplate() && !existingPrompt) {
      this.Client.UserQuota.promptQuotaExceeded();

      return;
    }

    // current user cannot create public prompt template, but can edit existing public prompt template
    if (
      prompt.PromptTypeNo === PromptTypeNo.PUBLIC &&
      !this.canCreatePublicPromptTemplate() &&
      (!existingPrompt || promptTypeChanged)
    ) {
      this.Client.UserQuota.publicPromptsQuotaExceeded();

      return;
    }

    // current user cannot create private prompt template, but can edit existing private prompt template
    if (
      prompt.PromptTypeNo === PromptTypeNo.PRIVATE &&
      !this.canCreatePrivatePromptTemplate() &&
      (!existingPrompt || promptTypeChanged)
    ) {
      this.Client.UserQuota.privatePromptsQuotaExceeded();

      return;
    }

    // current user cannot create team prompt template, but can edit existing team prompt template
    if (
      prompt.PromptTypeNo === PromptTypeNo.TEAM &&
      !this.canCreateTeamPromptTemplate() &&
      (!existingPrompt || promptTypeChanged)
    ) {
      this.Client.UserQuota.teamPromptsQuotaExceeded();

      return;
    }

    // validate prompt variables
    let validateVariablesResult = this.validatePromptVariables(prompt);
    if (validateVariablesResult.EnumMaxSizeError) {
      this.Client.UserQuota.upgradePromptVariableEnumMaxSize();
      return;
    } else if (validateVariablesResult.Errors?.length > 0) {
      let errorMessage = validateVariablesResult.Errors.join('<br>');
      errorMessage +=
        '<br><a class="AIPRM__underline" href="https://www.aiprm.com/tutorials/how-to-use-variables-in-prompts/#title-how-to-use-variables-in-prompts-0" target="_blank" rel="noopener noreferrer">Learn more about prompt variables</a>.';

      errors.push(errorMessage);
    }

    // reset prompt variables to undefined to avoid sending them
    prompt.PromptVariables = undefined;

    // require AuthorName and AuthorURL if prompt is public
    if (
      prompt.PromptTypeNo === PromptTypeNo.PUBLIC &&
      (!prompt.AuthorName.trim() || !prompt.AuthorURL.trim())
    ) {
      errors.push(
        'Please identify with Author Name and URL to publish a prompt template as public.'
      );
    }

    // require AuthorName if prompt is Team
    if (
      prompt.PromptTypeNo === PromptTypeNo.TEAM &&
      !prompt.AuthorName.trim()
    ) {
      errors.push(
        'Please identify with Author Name to publish a prompt template as Team prompt.'
      );
    }

    const missingPlaceholders = [];

    // require usage of target language placeholder if prompt is public
    if (
      prompt.PromptTypeNo === PromptTypeNo.PUBLIC &&
      !prompt.Prompt.includes(TargetLanguagePlaceholder)
    ) {
      missingPlaceholders.push(TargetLanguagePlaceholder);
    }

    // require usage of prompt placeholder in prompt template
    if (!prompt.Prompt.includes(PromptPlaceholder)) {
      missingPlaceholders.push(PromptPlaceholder);
    }

    // there is at least one missing placeholder
    if (missingPlaceholders.length > 0) {
      errors.push(
        currentCreatePromptMode === CreatePromptMode.BASIC
          ? `
          Please fill out all colored fields to create a prompt template.
          `
          : `
          Make sure you follow the Prompt Template guidelines. <br>
          You must use ${missingPlaceholders.join(' and ')} correctly. <br><br>
          Learn more <a class="AIPRM__underline" href="https://lrt.li/aiprmpromptguide" target="_blank" rel="noopener noreferrer">here</a>.
        `
      );
    }

    // show error notification if there are any errors
    if (errors.length > 0) {
      const errorMessage = /*html*/ `
        <div>
          <strong>Please fix the following errors:</strong> <br><br>
          ${errors.join('<br><br>')}
        </div>
      `;

      this.showNotification(NotificationSeverity.WARNING, errorMessage, false);
    }

    return errors.length === 0;
  },

  // save prompt template via API and update client state
  async savePromptAsTemplate(e) {
    e.preventDefault();

    // if it's basic mode -> build prompt template first (input with name createPromptMode in savePromptForm)
    const currentCreatePromptMode = document.querySelector(
      'input[name="createPromptMode"]:checked'
    ).value;

    if (currentCreatePromptMode === CreatePromptMode.BASIC) {
      this.buildBasicPrompt();
    }

    /** @type Prompt */
    const prompt = {
      ModelS: [],
    };
    const formData = new FormData(e.target);

    for (const [key, value] of formData) {
      if (key === 'ModelS') {
        prompt[key] = [...prompt.ModelS, value];
      } else {
        prompt[key] = value;
      }
    }

    prompt.PromptTypeNo = parseInt(prompt.PromptTypeNo);

    if (this.promptRequiresLiveCrawling(prompt.Prompt)) {
      prompt.PromptFeatureBitset |= PromptFeatureBitset.LIVE_CRAWLING;
    }

    // re-check user status
    await this.Client.checkUserStatus();

    if (!this.validatePrompt(prompt, currentCreatePromptMode)) {
      return;
    }

    try {
      const addToListID = await this.getAddToListIDForTeamPrompt(prompt);

      const savedPrompt = await this.Client.savePrompt(prompt, addToListID);

      // Update revision time to current time
      prompt.RevisionTime = new Date().toISOString();

      // track usage (creation of new prompt template)
      if (!prompt.ID) {
        this.Client.usePrompt(
          savedPrompt.ID,
          currentCreatePromptMode === CreatePromptMode.BASIC
            ? UsageTypeNo.CREATE_BASIC
            : UsageTypeNo.CREATE_ADVANCED
        );
      }

      // Update existing prompt template
      if (prompt.ID) {
        this.updatePromptsState(prompt);
      }
      // Add new prompt template to client state if it belongs to the current topic
      else if (
        this.PromptTopic === DefaultPromptTopic ||
        prompt.Community === this.PromptTopic
      ) {
        // New prompt template was created, set the ID
        prompt.ID = savedPrompt.ID;

        this.OwnPrompts.push(prompt);

        // Add prompt to public prompt templates if it is public
        if (prompt.Public) {
          this.PromptTemplates.push(prompt);
        }
      }
    } catch (error) {
      // user has reached the limit of public/private prompt templates
      if (
        error instanceof Reaction &&
        error.ReactionNo === ReactionNo.RXN_AIPRM_OVER_LIMIT_PROMPTS
      ) {
        this.Client.UserQuota.promptQuotaExceeded();

        return;
      }

      // switch to advanced mode if there was an error and the current mode is basic,
      // to allow the user to fix the error
      if (currentCreatePromptMode === CreatePromptMode.BASIC) {
        const advancedModeInput = document.getElementById(
          'createPromptModeAdvanced'
        );
        advancedModeInput.checked = true;

        // trigger the onchange event on the radio button to switch to advanced mode
        advancedModeInput.dispatchEvent(new Event('change'));
      }

      this.showNotification(
        NotificationSeverity.ERROR,
        error instanceof Reaction
          ? error.message
          : 'Something went wrong. Please try again.'
      );
      return;
    }

    this.hideSavePromptModal();

    await this.processSavePromptResult(prompt);

    await this.insertPromptTemplatesSection();

    // re-select prompt template if it was selected before to update the UI if prompt variable definitions were changed
    if (
      this.SelectedPromptTemplate != null &&
      prompt.ID == this.SelectedPromptTemplate.ID
    ) {
      await this.selectPromptTemplate(prompt);
    }
  },

  async getAddToListIDForTeamPrompt(prompt) {
    if (
      prompt.PromptTypeNo === PromptTypeNo.TEAM &&
      this.Client.UserQuota?.hasTeamsFeatureEnabled()
    ) {
      const ownTeamLists = this.Lists.lists.filter(
        (list) =>
          list.ListTypeNo == ListTypeNo.TEAM_CUSTOM &&
          list.HasWriteAccessForTeamMember(this.Client.UserTeamM)
      );

      if (ownTeamLists.length == 1) {
        const isInOwnTeamList = await this.isPromptInAtLeastOneList(
          prompt,
          ownTeamLists
        );

        if (!isInOwnTeamList) {
          return ownTeamLists[0].ID;
        }
      }
    }
  },

  async processSavePromptResult(prompt) {
    try {
      // Add to team list if team prompt
      if (
        prompt.PromptTypeNo === PromptTypeNo.TEAM &&
        this.Client.UserQuota?.hasTeamsFeatureEnabled()
      ) {
        let list;

        if (this.Client.OwnTeamS?.length == 0) {
          // create team and team list
          list = await this.Lists.create(
            this.Client,
            ListTypeNo.TEAM_CUSTOM,
            'My Team List',
            {
              PromptID: prompt.ID,
              Comment: '',
            },
            'NEW'
          );

          this.showNotification(
            NotificationSeverity.SUCCESS,
            'Prompt template now visible in Team List "' +
              sanitizeInput(list.Comment) +
              '" for Team "My First Team".'
          );
        } else {
          const ownTeamLists = this.Lists.lists.filter(
            (list) =>
              list.ListTypeNo == ListTypeNo.TEAM_CUSTOM &&
              list.HasWriteAccessForTeamMember(this.Client.UserTeamM)
          );

          const isInOwnTeamList = await this.isPromptInAtLeastOneList(
            prompt,
            ownTeamLists
          );

          if (ownTeamLists.length == 0) {
            //create team list
            list = await this.Lists.create(
              this.Client,
              ListTypeNo.TEAM_CUSTOM,
              'My Team List',
              {
                PromptID: prompt.ID,
                Comment: '',
              },
              this.Client.OwnTeamS[0].TeamID
            );

            this.showNotification(
              NotificationSeverity.SUCCESS,
              'Prompt template now visible in Team List "' +
                sanitizeInput(list.Comment) +
                '" for Team "' +
                sanitizeInput(
                  this.Client.UserTeamM?.get(list.ForTeamID)?.TeamName
                ) +
                '".'
            );
          } else if (ownTeamLists.length == 1) {
            if (isInOwnTeamList) {
              this.showNotification(
                NotificationSeverity.SUCCESS,
                'Prompt template was saved successfully.'
              );
            } else {
              list = ownTeamLists[0];

              const creationTime = new Date();

              list.list.Items.push({
                Comment: '',
                CreationTime: creationTime.toISOString(),
                ItemOrder: 0,
                ItemStatusNo: ItemStatusNo.ACTIVE,
                ListID: list.ID,
                PromptID: prompt.ID,
                RevisionTime: creationTime.toISOString(),
              });

              // add to TeamList is handled in savePrompt for this case
              this.showNotification(
                NotificationSeverity.SUCCESS,
                'Prompt template now visible in Team List "' +
                  sanitizeInput(list.Comment) +
                  '" for Team "' +
                  sanitizeInput(
                    this.Client.UserTeamM?.get(list.ForTeamID)?.TeamName
                  ) +
                  '".'
              );
            }
          } else {
            this.showNotification(
              NotificationSeverity.SUCCESS,
              'Prompt template was saved successfully.'
            );

            if (!isInOwnTeamList) {
              // show modal to pick team list
              this.showListSelectionModal(ownTeamLists, prompt, true);
            }
          }
        }
      } else if (
        prompt.PromptTypeNo === PromptTypeNo.PRIVATE &&
        this.PromptTemplatesList &&
        this.Lists.withIDAndType(this.PromptTemplatesList, ListTypeNo.CUSTOM)
      ) {
        const ownPrivateLists = this.Lists.lists.filter(
          (list) => list.ListTypeNo == ListTypeNo.CUSTOM
        );

        const isInOwnPrivateList = await this.isPromptInAtLeastOneList(
          prompt,
          ownPrivateLists
        );

        if (ownPrivateLists.length == 0) {
          this.showNotification(
            NotificationSeverity.SUCCESS,
            'Prompt template was saved successfully.'
          );
        } else if (ownPrivateLists.length == 1) {
          if (isInOwnPrivateList) {
            this.showNotification(
              NotificationSeverity.SUCCESS,
              'Prompt template was saved successfully.'
            );
          } else {
            const list = ownPrivateLists[0];

            if (!this.Client.UserQuota.canAddToCustomList(list)) {
              return;
            }

            await list.add({ ID: prompt.ID });

            this.showNotification(
              NotificationSeverity.SUCCESS,
              'Prompt template now visible in List "' +
                sanitizeInput(list.Comment) +
                '".'
            );
          }
        } else {
          this.showNotification(
            NotificationSeverity.SUCCESS,
            'Prompt template was saved successfully.'
          );

          if (!isInOwnPrivateList) {
            // show modal to pick list
            this.showListSelectionModal(
              this.Lists.getCustomWithWriteAccess(
                this.Client.UserQuota,
                this.Client.UserTeamM
              ),
              prompt,
              false
            );
          }
        }
      } else {
        this.showNotification(
          NotificationSeverity.SUCCESS,
          'Prompt template was saved successfully.'
        );
      }
    } catch (error) {
      // user has reached the limit of list items
      if (
        error instanceof Reaction &&
        error.ReactionNo === ReactionNo.RXN_AIPRM_QUOTA_EXCEEDED
      ) {
        this.Client.UserQuota.listItemQuotaExceeded();
        return;
      }

      this.showNotification(
        NotificationSeverity.ERROR,
        error instanceof Reaction
          ? error.message
          : 'Something went wrong. Please try again.'
      );
      return;
    }
  },

  /**
   * Checks if prompt is in at least one of the lists
   *
   * @param {Prompt} prompt
   * @param {List[]} lists
   * @returns {Promise<boolean>}
   */
  async isPromptInAtLeastOneList(prompt, lists) {
    if (lists.length == 0) {
      return false;
    }

    for (const list of lists) {
      if (await list.has(prompt)) {
        return true;
      }
    }

    return false;
  },

  /**
   * Update prompt templates in client state
   *
   * @param {Prompt} prompt
   */
  updatePromptsState(prompt) {
    // if topic doesn't match, remove prompt from PromptTemplates and OwnPrompts
    if (
      prompt.Community !== this.PromptTopic &&
      this.PromptTopic !== DefaultPromptTopic
    ) {
      this.PromptTemplates = this.PromptTemplates.filter(
        (template) => template.ID !== prompt.ID
      );

      this.OwnPrompts = this.OwnPrompts.filter(
        (ownPrompt) => ownPrompt.ID !== prompt.ID
      );

      return;
    }

    // remove template using ID from Team lists
    if (prompt.PromptTypeNo === PromptTypeNo.PRIVATE) {
      this.Lists.removeItemByPromptIDFromListsByType(
        prompt.ID,
        ListTypeNo.TEAM_CUSTOM
      );
    }

    // find prompt in OwnPrompts by ID and update it
    this.OwnPrompts = this.OwnPrompts.map((ownPrompt) =>
      ownPrompt.ID === prompt.ID ? prompt : ownPrompt
    );

    // find prompt in TeamPrompts by ID and update it
    this.TeamPrompts = this.TeamPrompts.map((teamPrompt) =>
      teamPrompt.ID === prompt.ID ? prompt : teamPrompt
    );

    // find the prompt in PromptTemplates by ID
    const promptTemplate = this.PromptTemplates.find(
      (template) => template.ID === prompt.ID
    );

    const isPublicPrompt = prompt.PromptTypeNo === PromptTypeNo.PUBLIC;

    // if prompt is not public and it is in PromptTemplates, remove it
    if (!isPublicPrompt && promptTemplate) {
      this.PromptTemplates = this.PromptTemplates.filter(
        (template) => template.ID !== prompt.ID
      );

      return;
    }

    // if prompt is public and it is not in PromptTemplates, add it
    if (isPublicPrompt && !promptTemplate) {
      this.PromptTemplates.push(prompt);

      return;
    }

    // if prompt is public and it is in PromptTemplates, update it
    if (isPublicPrompt && promptTemplate) {
      this.PromptTemplates = this.PromptTemplates.map((template) =>
        template.ID === prompt.ID ? prompt : template
      );
    }
  },

  /**
   * Simple notification based on ChatGPT "high demand" notification
   *
   * @param {NotificationSeverity} severity
   * @param {string} message
   * @param {boolean} autoHide
   */
  showNotification(
    severity = NotificationSeverity.SUCCESS,
    message = '',
    autoHide = true
  ) {
    const notificationElementID = 'AIPRM-Notification';

    let notificationElement = document.getElementById(notificationElementID);

    // if notification doesn't exist, create it
    if (!notificationElement) {
      notificationElement = document.createElement('div');
      notificationElement.id = notificationElementID;
    }

    const severityClassName = {
      [NotificationSeverity.INFO]: 'AIPRM__bg-gray-500',
      [NotificationSeverity.SUCCESS]: 'AIPRM__bg-green-500',
      [NotificationSeverity.WARNING]: 'AIPRM__bg-orange-500',
      [NotificationSeverity.ERROR]: 'AIPRM__bg-red-500',
    };

    notificationElement.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__flex AIPRM__justify-center AIPRM__w-full AIPRM__top-2 AIPRM__px-2 AIPRM__z-50 AIPRM__pointer-events-none">
        <div class="${
          severityClassName[severity]
        } AIPRM__flex AIPRM__flex-row AIPRM__inline-flex AIPRM__pointer-events-auto AIPRM__px-6 AIPRM__py-3 AIPRM__rounded-md AIPRM__text-white" role="alert">
          <div class="AIPRM__flex AIPRM__gap-4">
            <div>
              <p class="AIPRM__max-w-md" style="overflow-wrap: anywhere;">${message}</p>
              ${
                severity === NotificationSeverity.ERROR
                  ? /*html*/ `<br/><p class="AIPRM__max-w-md AIPRM__font-semibold" style="overflow-wrap: anywhere;">If this issue persists, please check <a href="https://forum.aiprm.com/" target="_blank" class="AIPRM__underline">forum.aiprm.com</a> and <a href="https://status.aiprm.com/" target="_blank" class="AIPRM__underline">status.aiprm.com</a> for updates.</p>`
                  : ''
              }
            </div>
            <button>${svg('Cross')}</button>
          </div>
        </div>
      </div>
    `;

    // remove notificationElement from DOM on click
    notificationElement
      .querySelector('button')
      .addEventListener('click', () => {
        notificationElement.remove();
      });

    // or remove notificationElement from DOM after 5 seconds
    if (autoHide) {
      setTimeout(() => {
        notificationElement.remove();
      }, 5000);
    }

    document.body.appendChild(notificationElement);
  },

  hideModal,

  hideSavePromptModal() {
    this.hideModal('savePromptModal');
  },

  // show modal to report prompt
  async showReportPromptModal(PromptIndex) {
    const prompt = (await this.getCurrentPromptTemplates())[PromptIndex];

    createReportPromptModal(prompt, this.reportPrompt.bind(this));
  },

  async createNewPrompt(e) {
    await this.showSavePromptModal(e);

    const form = document.getElementById('savePromptForm');
    this.prepareModelsMultiselect({}, form);
  },

  /**
   * Show modal to save prompt as template
   *
   * @param {Event|null} e
   */
  async showSavePromptModal(e) {
    let promptTemplate = '';

    const isEditPromptEvent = e && e.type === editPromptTemplateEvent;

    // re-check user status in case it's not editing of existing prompt template
    if (!isEditPromptEvent) {
      await this.Client.checkUserStatus();
    }

    // cannot add new prompt template, but still can edit existing one
    if (!this.canCreatePromptTemplate() && !isEditPromptEvent) {
      this.Client.UserQuota.promptQuotaExceeded();

      return;
    }

    // get the prompt template from current chat log if showSavePromptModal was called from "Save prompt as template" button (with event)
    if (
      e &&
      ![
        editPromptTemplateEvent,
        forkPromptTemplateEvent,
        clonePromptTemplateEvent,
      ].includes(e.type)
    ) {
      // get the element that triggered this onclick event
      const button = e.target.closest('button');

      // get the parent element of the button (the prompt container)
      const prompt =
        button.parentElement.parentElement.parentElement.querySelector(
          this.Config.getSelectorConfig().SavePromptAsTemplatePromptText
        );

      if (prompt) {
        promptTemplate = prompt.textContent;
      } else {
        console.error('showSavePromptModal: No prompt text found');
      }
    }

    let savePromptModal = document.getElementById('savePromptModal');

    // if modal does not exist, create it, add event listener on submit and append it to body
    if (!savePromptModal) {
      savePromptModal = document.createElement('div');
      savePromptModal.id = 'savePromptModal';

      savePromptModal.addEventListener(
        'submit',
        this.savePromptAsTemplate.bind(this)
      );

      document.body.appendChild(savePromptModal);
    }

    let lastCreatePromptMode = localStorage.getItem(lastCreatePromptModeKey);

    // last create prompt mode from localStorage or default to basic
    lastCreatePromptMode =
      lastCreatePromptMode &&
      [CreatePromptMode.BASIC, CreatePromptMode.ADVANCED].includes(
        lastCreatePromptMode
      )
        ? lastCreatePromptMode
        : CreatePromptMode.BASIC;

    // if it's edit, clone or fork prompt event, use advanced mode otherwise use last create prompt mode
    const currentCreatePromptMode = e
      ? CreatePromptMode.ADVANCED
      : lastCreatePromptMode;

    const isAdvancedMode =
      currentCreatePromptMode === CreatePromptMode.ADVANCED;

    // Prompt Builder
    this.PromptBuilder = new PromptBuilder(this.PromptBuilderOptions);

    savePromptModal.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__text-center AIPRM__transition-opacity AIPRM__z-50">
        <div class="AIPRM__absolute AIPRM__bg-gray-900 AIPRM__inset-0 AIPRM__opacity-90">
        </div>

        <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__overflow-y-auto">
          <div class="AIPRM__flex AIPRM__justify-center AIPRM__min-h-full">

            <form id="savePromptForm">
              <div
                class="AIPRM__align-center AIPRM__bg-white dark:AIPRM__bg-gray-800 dark:AIPRM__text-gray-200 AIPRM__inline-block AIPRM__overflow-hidden sm:AIPRM__rounded-lg AIPRM__shadow-xl sm:AIPRM__align-middle sm:AIPRM__max-w-lg sm:AIPRM__my-8 sm:AIPRM__w-full AIPRM__text-left AIPRM__transform AIPRM__transition-all"
                role="dialog" aria-modal="true" aria-labelledby="modal-headline">

                <div
                  class="AIPRM__bg-white dark:AIPRM__bg-gray-800 AIPRM__px-4 AIPRM__pt-5 AIPRM__pb-4 sm:AIPRM__p-6 sm:AIPRM__pb-4 AIPRM__overflow-y-auto">

                  <div class="AIPRM__flex AIPRM__justify-end AIPRM__mb-2 ${
                    e ? 'AIPRM__hidden' : ''
                  }">
                    <ul
                      class="AIPRM__bg-gray-100 dark:AIPRM__bg-gray-900 AIPRM__flex AIPRM__gap-1 AIPRM__list-none AIPRM__p-1 AIPRM__relative AIPRM__rounded-xl AIPRM__text-gray-900 AIPRM__text-sm">
                      <li>
                        <input class="AIPRM__hidden" type="radio" name="createPromptMode" id="createPromptModeBasic"
                          value="${CreatePromptMode.BASIC}" ${
      !isAdvancedMode ? 'checked' : ''
    } hidden
                          onchange="AIPRM.toggleCreatePromptMode(event)" />

                        <label for="createPromptModeBasic" class="AIPRM__cursor-pointer AIPRM__border AIPRM__flex AIPRM__gap-1 AIPRM__items-center AIPRM__justify-center md:AIPRM__gap-2 AIPRM__outline-none AIPRM__px-5 AIPRM__py-1 AIPRM__relative AIPRM__rounded-lg sm:AIPRM__w-auto AIPRM__w-full ${
                          !isAdvancedMode
                            ? 'AIPRM__toggle-button--active'
                            : 'AIPRM__toggle-button--inactive'
                        }">Basic</label>
                      </li>
                      <li>
                        <input class="AIPRM__hidden" type="radio" name="createPromptMode" id="createPromptModeAdvanced"
                          value="${CreatePromptMode.ADVANCED}" ${
      isAdvancedMode ? 'checked' : ''
    } hidden
                          onchange="AIPRM.toggleCreatePromptMode(event)" />

                        <label for="createPromptModeAdvanced" class="AIPRM__cursor-pointer AIPRM__border AIPRM__flex AIPRM__gap-1 AIPRM__items-center AIPRM__justify-center md:AIPRM__gap-2 AIPRM__outline-none AIPRM__px-5 AIPRM__py-1 AIPRM__relative AIPRM__rounded-lg sm:AIPRM__w-auto AIPRM__w-full ${
                          isAdvancedMode
                            ? 'AIPRM__toggle-button--active'
                            : 'AIPRM__toggle-button--inactive'
                        }">Advanced</label>
                      </li>
                    </ul>
                  </div>

                  <div id="AIPRM__PromptBuilder" class="${
                    isAdvancedMode ? 'AIPRM__hidden' : ''
                  }">
                    ${this.PromptBuilder.render()}
                  </div>

                  <div id="AIPRM__PromptForm" class="${
                    !isAdvancedMode ? 'AIPRM__hidden' : ''
                  }">
                    <input type="hidden" name="ID" />
                    <input type="hidden" name="OwnPrompt" value="true" />
                    <input type="hidden" name="Views" value="0" />
                    <input type="hidden" name="Usages" value="0" />
                    <input type="hidden" name="Votes" value="0" />
                    <input type="hidden" name="ForkedFromPromptID" />

                    <label>Prompt Template</label>
                    <textarea name="Prompt"
                      class="AIPRM__w-full AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__p-2 AIPRM__mt-2 AIPRM__mb-3"
                      style="height: 120px;" ${
                        isAdvancedMode ? ' required ' : ''
                      }
                      placeholder="Prompt text including placeholders [TARGETLANGUAGE], [PROMPT], [VARIABLE1], [VARIABLE2] and [VARIABLE3] replaced automagically by AIPRM.&#10;&#10;[VARIABLE1], [VARIABLE2] and [VARIABLE3] require title with optional default value and available values.&#10;&#10;Example: Example [PROMPT] in [TARGETLANGUAGE] with [VARIABLE1], [VARIABLE2] and [VARIABLE3].&#10;[VARIABLE1:Title] [VARIABLE2:Title:Default Value] [VARIABLE3:Title:Default Value:Available Value 1|Available Value 2|Available Value 3].&#10;&#10;[VARIABLE1], [VARIABLE2] and [VARIABLE3] will be pre-filled using URL parameters AIPRM_VARIABLE1, AIPRM_VARIABLE2 and AIPRM_VARIABLE3."
                      title="Prompt text including placeholders [TARGETLANGUAGE], [PROMPT], [VARIABLE1], [VARIABLE2] and [VARIABLE3] replaced automagically by AIPRM. [VARIABLE1], [VARIABLE2] and [VARIABLE3] require title with optional default value and available values. Example: Example [PROMPT] in [TARGETLANGUAGE] with [VARIABLE1], [VARIABLE2] and [VARIABLE3]. [VARIABLE1:Title] [VARIABLE2:Title:Default Value] [VARIABLE3:Title:Default Value:Available Value 1|Available Value 2|Available Value 3]. [VARIABLE1], [VARIABLE2] and [VARIABLE3] will be pre-filled using URL parameters AIPRM_VARIABLE1, AIPRM_VARIABLE2 and AIPRM_VARIABLE3.">${sanitizeInput(
                        promptTemplate
                      )}</textarea>

                    <label>Teaser</label>
                    <textarea name="Teaser" ${
                      isAdvancedMode ? ' required ' : ''
                    }
                      title="Short teaser for this prompt template, e.g. 'Create a keyword strategy and SEO content plan from 1 [KEYWORD]'"
                      class="AIPRM__w-full AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__p-2 AIPRM__mt-2 AIPRM__mb-3"
                      style="height: 71px;"
                      placeholder="Create a keyword strategy and SEO content plan from 1 [KEYWORD]"></textarea>

                    <label>Prompt Hint</label>
                    <input name="PromptHint" ${
                      isAdvancedMode ? 'required' : ''
                    } type="text"
                      title="Prompt hint for this prompt template, e.g. '[KEYWORD]' or '[your list of keywords, maximum ca. 8000]"
                      class="AIPRM__w-full AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__p-2 AIPRM__mt-2 AIPRM__mb-3"
                      placeholder="[KEYWORD] or [your list of keywords, maximum ca. 8000]" />

                    <label>Title</label>
                    <input name="Title" type="text" title="Short title for this prompt template, e.g. 'Keyword Strategy'"
                      ${
                        isAdvancedMode ? 'required' : ''
                      } placeholder="Keyword Strategy"
                      class="AIPRM__w-full AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__mb-3 AIPRM__mt-2 AIPRM__p-2" />

                    <div class="AIPRM__flex">
                      <div class="AIPRM__mr-4 AIPRM__w-full">
                        <label>Topic</label>
                        <select name="Community"
                          class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full"
                          ${isAdvancedMode ? ' required ' : ''}>
                          ${this.Topics.map(
                            (topic) => /*html*/ `
                          <option value="${sanitizeInput(topic.ID)}" ${
                              topic.ID === this.PromptTopic ? 'selected' : ''
                            }>
                            ${sanitizeInput(topic.Label)}</option>`
                          ).join('')}
                        </select>
                      </div>

                      <div class="AIPRM__w-full">
                        <label>Activity</label>
                        <select name="Category"
                          class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full"
                          ${isAdvancedMode ? ' required ' : ''}>
                          ${this.getActivities(
                            this.PromptTopic === DefaultPromptTopic
                              ? this.Topics[0].ID
                              : this.PromptTopic
                          )
                            .map(
                              (activity) => /*html*/ `
                          <option value="${sanitizeInput(
                            activity.ID
                          )}">${sanitizeInput(activity.Label)}</option>`
                            )
                            .join('')}
                        </select>
                      </div>
                    </div>

                    <div class="AIPRM__flex">
                      <div class="AIPRM__mr-4 AIPRM__w-full">
                        <label>Who can see this?</label>
                        <select name="PromptTypeNo"
                          class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full"
                          ${isAdvancedMode ? ' required ' : ''}>
                          <option value="${
                            PromptTypeNo.PRIVATE
                          }">Only me (Private)</option>
                          ${
                            this.Client.UserQuota?.hasTeamsFeatureEnabled()
                              ? /* html */ `<option value="${PromptTypeNo.TEAM}">My Team</option>`
                              : ''
                          }
                          <option id="PromptTypeNo-public" value="${
                            PromptTypeNo.PUBLIC
                          }">Everyone (Public)</option>
                        </select>
                      </div>
                      <div class="AIPRM__w-full">
                        <label>Made for</label>
                        <select multiple multiselect-max-items="1" multiselect-hide-x="true" name="ModelS"
                          class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full">
                          ${this.Models.map(
                            (model) => /*html*/ `
                          <option value="${sanitizeInput(
                            model.ID
                          )}" AIPRMModelStatusNo="${
                              model.StatusNo
                            }">${sanitizeInput(model.LabelAuthor)}</option>`
                          ).join('')}
                        </select>
                      </div>
                    </div>

                    <div class="AIPRM__block">
                      <div class="AIPRM__flex AIPRM__justify-between AIPRM__mt-4">
                        <div class="AIPRM__mr-4 AIPRM__w-full"><label>Author Name</label>
                          <input name="AuthorName" type="text" title="Author Name visible for all users"
                            placeholder="Author Name"
                            class="AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__mb-3 AIPRM__mt-2 AIPRM__p-2 AIPRM__w-full" />
                        </div>

                        <div class="AIPRM__w-full"><label>Author URL</label>
                          <input name="AuthorURL" type="url" title="Author URL visible for all users"
                            placeholder="https://www.example.com/"
                            class="AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__mb-3 AIPRM__mt-2 AIPRM__p-2 AIPRM__w-full" />
                        </div>
                      </div>

                      <a class="AIPRM__mt-4 AIPRM__text-sm AIPRM__underline AIPRM__hidden" id="savePromptForm-forked-from"
                        href="https:/app.aiprm.com/prompt/" rel="noopener noreferrer" target="_blank">
                        Forked From
                      </a>
                    </div>

                    <p class="AIPRM__mt-6 AIPRM__text-[10px]" id="savePromptForm-public-disclaimer">Please be mindful of what
                      you share, and do not include any confidential information, as we are not responsible for
                      any actions taken by others with the information you choose to share.</p>
                  </div>

                </div>

                <div class="AIPRM__bg-gray-200 dark:AIPRM__bg-gray-700 AIPRM__px-4 AIPRM__py-3 AIPRM__text-right">
                  <button type="button"
                    class="AIPRM__bg-gray-600 hover:AIPRM__bg-gray-800 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white"
                    onclick="AIPRM.hideSavePromptModal()"> Cancel
                  </button>
                  <button id="AIPRM__cloneButton" type="button"
                    class="AIPRM__hidden AIPRM__bg-blue-600 hover:AIPRM__bg-blue-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white">Clone
                  </button>
                  <button type="submit"
                    class="AIPRM__bg-green-600 hover:AIPRM__bg-green-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white">Save
                    Prompt
                  </button>
                </div>
                
              </div>
            </form>

          </div>
        </div>

      </div>
    `;

    const form = document.getElementById('savePromptForm');

    // set PromptTypeNo based on from where the modal was opened
    if (!isEditPromptEvent) {
      if (this.PromptTemplatesType === PromptTemplatesType.PUBLIC) {
        form.elements['PromptTypeNo'].value = PromptTypeNo.PUBLIC;
      } else if (this.PromptTemplatesType === PromptTemplatesType.OWN) {
        form.elements['PromptTypeNo'].value = PromptTypeNo.PRIVATE;
      } else {
        const selectedList = this.Lists.withID(this.PromptTemplatesList);
        if (selectedList.ListTypeNo === ListTypeNo.TEAM_CUSTOM) {
          form.elements['PromptTypeNo'].value = PromptTypeNo.TEAM;
        } else {
          form.elements['PromptTypeNo'].value = PromptTypeNo.PRIVATE;
        }
      }
    }

    // add onchange event listener to select[name="Community"] to update the activities
    savePromptModal.querySelector('select[name="Community"]').onchange = (
      event
    ) => {
      // replace select[name="Category"] with new activities
      savePromptModal.querySelector('select[name="Category"]').innerHTML =
        this.getActivities(event.target.value)
          .map(
            (activity) => /*html*/ `
            <option value="${sanitizeInput(activity.ID)}">${sanitizeInput(
              activity.Label
            )}</option>`
          )
          .join('');
    };

    savePromptModal.style = 'display: block;';

    // add event listener to close the modal on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideSavePromptModal();
      }
    });
  },

  /**
   *
   * Toggle between the "Basic" and "Advanced" mode
   * and the "Prompt Builder" and "Save Prompt Form"
   *
   * @param {Event} event
   */
  toggleCreatePromptMode(event) {
    // update last create prompt mode in localStorage
    localStorage.setItem(lastCreatePromptModeKey, event.currentTarget.value);

    // toggle the "Basic" and "Advanced" switch
    event.currentTarget.parentElement.parentElement
      .querySelectorAll('label')
      .forEach((element) => {
        [
          'AIPRM__toggle-button--active',
          'AIPRM__toggle-button--inactive',
        ].forEach((className) => {
          element.classList.toggle(className);
        });
      });

    // toggle the "Prompt Builder" and "Save Prompt Form"
    document
      .querySelectorAll('#AIPRM__PromptBuilder, #AIPRM__PromptForm')
      .forEach((element) => {
        element.classList.toggle('AIPRM__hidden');
      });

    // toggle the required attribute on the inputs ("An invalid form control with ... is not focusable.")
    // if advanced mode -> add required attribute, else remove it
    document
      .querySelectorAll(
        '#AIPRM__PromptForm textarea[name="Prompt"], #AIPRM__PromptForm textarea[name="Teaser"], #AIPRM__PromptForm input[name="PromptHint"], #AIPRM__PromptForm input[name="Title"], #AIPRM__PromptForm select[name="Community"], #AIPRM__PromptForm select[name="Category"], #AIPRM__PromptForm select[name="PromptTypeNo"]'
      )
      .forEach((element) => {
        element.toggleAttribute('required');
      });

    this.buildBasicPrompt();
  },

  // Build prompt using PromptBuilder and update the form
  buildBasicPrompt() {
    this.PromptBuilder.build();

    const prompt = this.PromptBuilder.get();

    if (!prompt.Prompt) {
      return;
    }

    const form = document.getElementById('savePromptForm');

    const currentPromptTypeNo = +form.elements['PromptTypeNo'].value;

    // Set AuthorName if current PromptTypeNo is TEAM (required)
    if (currentPromptTypeNo === PromptTypeNo.TEAM) {
      // Use AIPRM user name if available, otherwise OpenAI user name as fallback
      form.elements['AuthorName'].value =
        this.Client.AppUser?.Name ||
        window?.__NEXT_DATA__?.props?.pageProps?.user?.name ||
        '';
    }
    // Otherwise set PromptTypeNo to PRIVATE (PUBLIC requires AuthorURL)
    else {
      form.elements['PromptTypeNo'].value = PromptTypeNo.PRIVATE;
    }

    form.elements['Prompt'].value = prompt.Prompt;
    form.elements['Teaser'].value = prompt.Teaser;
    form.elements['PromptHint'].value = prompt.PromptHint;
    form.elements['Title'].value = prompt.Title;
  },

  // This function adds an "Export Button" to the sidebar
  addExportButton() {
    const selectorConfig = this.Config.getSelectorConfig();

    // Get the nav element in the sidebar
    const nav = document.querySelector(selectorConfig.ExportButton);
    // If there is no nav element or the "Export Button" already exists, skip
    if (!nav || nav.querySelector('#export-button')) return;

    // Create the "Export Button" element
    const button = document.createElement('a');
    button.id = 'export-button';
    button.className = css`ExportButton`;
    button.innerHTML = /*html*/ `${svg`Export`} Export Chat`;
    button.onclick = this.exportCurrentChat.bind(this);

    // If there is no chat started, disable the button
    if (document.querySelector(selectorConfig.ExportButtonChatStarted)) {
      button.style = 'pointer-events: none;opacity: 0.5';
    }

    // Get the Log out button as a reference
    const colorModeButton = [...nav.children].find((child) =>
      child.innerText.includes('Log out')
    );
    // Insert the "Export Button" before the "Color Mode" button
    nav.insertBefore(button, colorModeButton);

    // Create the "Version" element
    const version = document.createElement('a');
    version.id = 'AppName';
    version.className = css`VersionInfo`;
    version.innerHTML = /*html*/ `${svg`Rocket`}` + AppName + ' powered';
    //version.onclick = exportCurrentChat
    version.href = AppURL;
    version.target = '_blank';

    // Get the Log out button as a reference
    const colorModeButton2 = [...nav.children].find((child) =>
      child.innerText.includes('Log out')
    );
    // Insert the "Export Button" before the "Color Mode" button

    nav.insertBefore(version, colorModeButton2);

    // Create the "AIPRM Community Forum" element
    const forum = document.createElement('a');
    forum.className = css('VersionInfo');
    forum.innerHTML = `${svg('Community')} AIPRM Community Forum`;
    forum.href = AppCommunityForumURL;
    forum.target = '_blank';

    nav.insertBefore(forum, colorModeButton);
  },

  // This function gets the "New Chat" buttons
  getNewChatButtons() {
    const selectorConfig = this.Config.getSelectorConfig();

    // Get the sidebar and topbar elements
    const sidebar = document.querySelector(selectorConfig.NewChatSidebar);
    const topbar = document.querySelector(selectorConfig.NewChatTopbar);
    // Get the "New Chat" button in the sidebar
    const newChatButton = [
      ...(sidebar?.querySelectorAll(selectorConfig.NewChatSidebarButton) ?? []),
    ].find((e) => e.innerText === selectorConfig.NewChatSidebarButtonText);
    // Get the "Plus" button in the topbar
    const AddButton = topbar?.querySelector(selectorConfig.NewChatTopbarButton);
    // Return an array containing the buttons, filtering out any null elements
    return [newChatButton, AddButton].filter((button) => button);
  },

  /**
   * Return current prompt templates based on selected prompt templates type and prompt list
   *
   * @returns {Promise<Prompt[]>}
   */
  async getCurrentPromptTemplates() {
    if (this.PromptTemplatesType !== PromptTemplatesType.CUSTOM_LIST) {
      return this.PromptTemplatesType === PromptTemplatesType.OWN
        ? this.OwnPrompts
        : this.PromptTemplates.filter(
            // filter out forked public prompts from "Public" tab
            (template) => !template.ForkedFromPromptID
          );
    }

    // find all prompts which are in current list
    const list = this.Lists.withID(this.PromptTemplatesList);

    if (!list) {
      console.error(
        'getCurrentPromptTemplates: No list found for ID',
        this.PromptTemplatesList
      );
      return [];
    }

    const listPromptIDS = await list.getPromptIDS();

    if (!listPromptIDS) {
      return [];
    }

    // if list has items, return prompts which are in list and are from selected topic
    const templates = [
      ...this.PromptTemplates,
      ...this.OwnPrompts,
      ...this.TeamPrompts,
    ].filter(
      (prompt) =>
        listPromptIDS.includes(prompt.ID) &&
        (this.PromptTopic === DefaultPromptTopic ||
          prompt.Community === this.PromptTopic)
    );

    // make sure templates are unique based on ID
    return [...new Map(templates.map((item) => [item.ID, item])).values()];
  },

  /**
   * Filter templates based on selected activity, model and search query
   *
   * @param {Prompt[]} templates
   * @returns {Promise<Prompt[]>} filtered templates
   */
  async filterPromptTemplates(templates) {
    const hiddenList = this.Lists.getHidden();

    return templates.filter((template) => {
      // If the template is hidden and the user is not in the hidden list, skip it
      if (
        template.IsHidden &&
        (this.PromptTemplatesType !== PromptTemplatesType.CUSTOM_LIST ||
          this.PromptTemplatesList !== hiddenList?.ID)
      ) {
        return false;
      }

      return (
        (this.PromptActivity === DefaultPromptActivity ||
          template.Category === this.PromptActivity) &&
        (this.PromptModel === DefaultPromptModel ||
          this.isTemplateForModel(template, this.PromptModel)) &&
        (!this.PromptSearch ||
          template.Teaser.toLowerCase().includes(
            this.PromptSearch.toLowerCase()
          ) ||
          template.Title.toLowerCase().includes(
            this.PromptSearch.toLowerCase()
          ))
      );
    });
  },

  // This function inserts a section containing a list of prompt templates into the chat interface
  async insertPromptTemplatesSection() {
    // If there are no topics or activities do not insert the section, yet
    if (!this.Topics.length || !this.Activities.length) {
      console.error(
        'insertPromptTemplatesSection: No topics or activities found, skipping prompt templates'
      );
      return;
    }

    const selectorConfig = this.Config.getSelectorConfig();

    // Get the title element (as a reference point and also for some alteration)
    const title = document.querySelector(selectorConfig.DashboardTitle);

    // If there is no title element, return
    if (!title) {
      console.error(
        'insertPromptTemplatesSection: No title element found, skipping prompt templates'
      );
      return;
    }

    // Hide the title element and examples
    title.style = 'display: none';

    // Hide the examples if they are present, but do not hide own templates wrapper
    if (title.nextSibling && title.nextSibling.id !== 'templates-wrapper') {
      title.nextSibling.style = 'display: none;';
    }

    // Make sure the model selector is not sticky (to avoid overlapping with the prompt templates)
    const modelSelector = document.querySelector(
      selectorConfig.ModelSelectorContainer || null
    );

    if (modelSelector) {
      modelSelector.classList.remove('sticky');
    }

    // Get the list of prompt templates
    let templates = this.PromptTemplates;

    // If there are no templates, skip
    if (!templates) {
      console.error(
        'insertPromptTemplatesSection: No prompt templates found, skipping prompt templates'
      );
      return;
    }

    templates = await this.getCurrentPromptTemplates();

    // Use index as ID for each template actions
    templates = await Promise.all(
      templates.map(async (template, index) => ({
        ...template,
        ID: index,
        IsHidden: await this.isHidden(template),
      }))
    );

    // Filter templates based on selected activity and search query
    templates = await this.filterPromptTemplates(templates);

    // Get the parent element of the title element (main page)
    const parent = title.parentElement;

    // If there is no parent element, skip
    if (!parent) {
      console.error(
        'insertPromptTemplatesSection: No parent element found, skipping prompt templates'
      );
      return;
    }

    // Apply prompt templates specific layout changes
    this.applyLayoutChanges(LayoutChangeType.PROMPT_TEMPLATES);

    const isSidebarView = parent.id?.includes('AIPRM__sidebar-container');

    // Get the current page number and page size from the promptTemplateSection object
    const { currentPage, pageSize } = this.PromptTemplateSection;

    // Calculate the start and end indices of the current page of prompt templates
    const start = pageSize * currentPage;
    const end = Math.min(pageSize * (currentPage + 1), templates.length);

    // Get the current page of prompt templates and add "IsFavorite" flag to each of the current templates
    const currentTemplates = await Promise.all(
      templates.slice(start, end).map(async (template) => ({
        ...template,
        IsFavorite: await this.isFavorite(template.ID),
        IsVerified: await this.isVerified(template.ID),
      }))
    );

    const favoritesList = this.Lists.getFavorites();
    const isFavoritesListView = this.PromptTemplatesList === favoritesList?.ID;

    const hiddenList = this.Lists.getHidden();

    const customLists = this.Lists.getCustom(this.Client.UserQuota);
    const customListIDS = customLists.map((list) => list.ID);

    const AIPRMVerifiedList = this.Lists.getAIPRMVerified();

    const isCustomListView =
      this.PromptTemplatesType === PromptTemplatesType.CUSTOM_LIST &&
      (customListIDS.includes(this.PromptTemplatesList) ||
        (AIPRMVerifiedList?.ID === this.PromptTemplatesList &&
          AIPRMVerifiedList.OwnList));

    const selectedList = this.Lists.withID(this.PromptTemplatesList);

    // Pagination buttons (conditionally rendered, depending on the number of prompt templates)
    const paginationContainer = /*html*/ `
    <div class="AIPRM__flex AIPRM__flex-1 AIPRM__gap-3.5 AIPRM__justify-between AIPRM__items-center AIPRM__flex-col sm:AIPRM__flex-row AIPRM__mt-6">
      <div class="AIPRM__text-left" style="margin-top: -1rem;">
        <label class="AIPRM__block AIPRM__text-sm AIPRM__font-medium" title="The number of prompt templates per page">Prompts per Page</label>
        <select class="AIPRM__bg-gray-100 AIPRM__border-0 AIPRM__text-sm AIPRM__rounded AIPRM__block AIPRM__w-full dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-600 dark:AIPRM__placeholder-gray-400 dark:AIPRM__text-white hover:AIPRM__bg-gray-200 focus:AIPRM__ring-0 dark:hover:AIPRM__bg-gray-900 pageSizeSelect">
          ${pageSizeOptions
            .map(
              (pageSize) => /*html*/ `
                <option value="${pageSize}" ${
                pageSize === this.PromptTemplateSection.pageSize
                  ? 'selected'
                  : ''
              }>${pageSize}</option>`
            )
            .join('')}
        </select>
      </div>
      
      <span class="${css`paginationText`}">
        Showing <span class="${css`paginationNumber`}">${
      start + 1
    }</span> to <span class="${css`paginationNumber`}">${end}</span> of <span class="${css`paginationNumber`}">${
      templates.length
    } Prompts</span>
      </span>
      <div class="${css`paginationButtonGroup`}">
        <button onclick="AIPRM.prevPromptTemplatesPage()" class="${css`paginationButton`}" style="border-radius: 6px 0 0 6px">Prev</button>
        <button onclick="AIPRM.nextPromptTemplatesPage()" class="${css`paginationButton`} AIPRM__border-0 AIPRM__border-l AIPRM__border-gray-500" style="border-radius: 0 6px 6px 0">Next</button>
      </div>
    </div>
  `;

    // Create the HTML for the prompt templates section
    const html = /*html*/ `
    <div class="${css`column`} AIPRM__relative" style="min-width: 0">


      ${
        isSidebarView
          ? /*html*/ `
          <div class="lg:AIPRM__absolute AIPRM__top-0 AIPRM__right-0 AIPRM__text-right">
            <a title="Close AIPRM sidebar"
              class="AIPRM__p-2 AIPRM__cursor-pointer AIPRM__align-middle AIPRM__inline-block AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" 
              onclick="event.stopPropagation(); document.getElementById('AIPRM__sidebar-icon').click()">
              ${svg('CrossExtraLarge')}
            </a>
          </div>`
          : /* html */ `
          <div class="lg:AIPRM__absolute AIPRM__top-0 AIPRM__right-0 AIPRM__text-right">
            <div class="AIPRM__mb-2">
              ${
                this.Client.AppUser
                  ? /*html*/ `
                    <div class="AIPRM__mb-2">
                      <div>
                        Hello, <a target="_blank" href="${AppAccountURL}">
                          ${sanitizeInput(this.Client.AppUser.Name)}
                        </a>
                      </div>
                            
                      <div>
                        <a target="_blank" class="AIPRM__underline" href="" onclick="event.preventDefault(); AIPRM.showAccountModal()">Your AIPRM Account</a>
                      </div>
                    </div>`
                  : /*html*/ `<a href="${AppAccountURL}?action=connect" target="blank">Login</a>`
              }
            </div>        
            
            ${
              this.isAdmin()
                ? /*html*/ `
                  <label class="AIPRM__relative AIPRM__inline-flex AIPRM__items-center AIPRM__mb-5 AIPRM__cursor-pointer AIPRM__flex-col" title="Admin Mode">
                    <input type="checkbox" value="" class="AIPRM__sr-only AIPRM__peer" id="adminMode" onchange="AIPRM.toggleAdminMode()" ${
                      this.AdminMode ? ' checked' : ''
                    }>
                    <div class="AIPRM__w-9 AIPRM__h-5 AIPRM__bg-gray-200 peer-focus:AIPRM__outline-none AIPRM__rounded-full AIPRM__peer dark:AIPRM__bg-gray-700 peer-checked:after:AIPRM__translate-x-full peer-checked:after:AIPRM__border-white after:AIPRM__content-[''] after:AIPRM__absolute after:AIPRM__top-[2px] after:AIPRM__left-[2px] after:AIPRM__bg-white after:AIPRM__border-gray-300 after:AIPRM__border after:AIPRM__rounded-full after:AIPRM__h-4 after:AIPRM__w-4 after:AIPRM__transition-all dark:AIPRM__border-gray-600 peer-checked:AIPRM__bg-gray-600"></div>
                    <span class="AIPRM__ml-3 AIPRM__text-sm AIPRM__font-medium AIPRM__text-gray-900 dark:AIPRM__text-gray-300"></span>
                  </label>
                `
                : ''
            }
          </div>`
      }

      ${svg`PromptBubble`}

      <h2 class="${css`h2`}">${
      this.Client &&
      this.Client.UserQuota &&
      this.Client.UserQuota.hasPaidPlan()
        ? AppSloganPremium
        : AppSlogan
    }</h2>
      
      <ul class="AIPRM__flex AIPRM__flex-col AIPRM__gap-3.5 AIPRM__mb-4">
        <ul class="AIPRM__border-b AIPRM__border-gray-200 dark:AIPRM__border-gray-700 dark:AIPRM__text-gray-400 md:AIPRM__flex AIPRM__flex-wrap AIPRM__font-medium AIPRM__text-center AIPRM__text-gray-500 AIPRM__text-sm AIPRM__whitespace-nowrap">
    
          <li class="AIPRM__flex-1 AIPRM__mr-2">
            <a href="#" id="favoritePromptsTab" title="Your &quot;Favorites&quot; List" 
              onclick="${
                favoritesList
                  ? `AIPRM.changePromptTemplatesType('${PromptTemplatesType.CUSTOM_LIST}', '${favoritesList.ID}')`
                  : 'AIPRM.Client.UserQuota.canUseFavorites(AIPRM.Lists) ? AIPRM.howToUseFavoriteList() : null'
              }" 
              class="${
                favoritesList &&
                this.PromptTemplatesType === PromptTemplatesType.CUSTOM_LIST &&
                this.PromptTemplatesList === favoritesList.ID
                  ? 'AIPRM__bg-gray-50 dark:AIPRM__bg-white/5'
                  : ''
              } dark:hover:AIPRM__bg-gray-900 dark:hover:AIPRM__text-gray-300 hover:AIPRM__bg-gray-50 hover:AIPRM__text-gray-600 AIPRM__p-4 AIPRM__rounded-t-lg AIPRM__flex AIPRM__justify-center AIPRM__w-full">
              ${svg('StarSolidLarge')} &nbsp; Favorites 
            </a>
          </li>

          <li class="AIPRM__flex-1 AIPRM__mr-2">
            <a href="#" id="AIPRMVerifiedPromptsTab" title="&quot;AIPRM Verified&quot; Prompts List" 
              onclick="AIPRM.Client.UserQuota.canUseAIPRMVerifiedList() ? AIPRM.changePromptTemplatesType('${
                PromptTemplatesType.CUSTOM_LIST
              }', '${AIPRMVerifiedList?.ID}') : ''"
              class="${
                AIPRMVerifiedList &&
                this.PromptTemplatesType === PromptTemplatesType.CUSTOM_LIST &&
                this.PromptTemplatesList === AIPRMVerifiedList?.ID
                  ? 'AIPRM__bg-gray-50 dark:AIPRM__bg-white/5'
                  : ''
              } dark:hover:AIPRM__bg-gray-900 dark:hover:AIPRM__text-gray-300 hover:AIPRM__bg-gray-50 hover:AIPRM__text-gray-600 AIPRM__p-4 AIPRM__rounded-t-lg AIPRM__flex AIPRM__justify-center AIPRM__w-full">
              ${svg('CheckBadgeSolidLarge')} &nbsp; AIPRM
            </a>
          </li>

          <li class="AIPRM__flex-1 AIPRM__mr-2">
            <a href="#" id="publicPromptsTab" onclick="AIPRM.changePromptTemplatesType('${
              PromptTemplatesType.PUBLIC
            }')" 
            class="${
              this.PromptTemplatesType === PromptTemplatesType.PUBLIC
                ? 'AIPRM__bg-gray-50 dark:AIPRM__bg-white/5'
                : ''
            } dark:hover:AIPRM__bg-gray-900 dark:hover:AIPRM__text-gray-300 hover:AIPRM__bg-gray-50 hover:AIPRM__text-gray-600 AIPRM__inline-block AIPRM__p-4 AIPRM__rounded-t-lg AIPRM__w-full">
              Public
            </a>
          </li>
          <li class="AIPRM__flex-1 AIPRM__mr-2">
            <a href="#" id="ownPromptsTab" title="Prompts you own (Private + Team + Public)" 
            onclick="AIPRM.changePromptTemplatesType('${
              PromptTemplatesType.OWN
            }')" 
            class="${
              this.PromptTemplatesType === PromptTemplatesType.OWN
                ? 'AIPRM__bg-gray-50 dark:AIPRM__bg-white/5'
                : ''
            } dark:hover:AIPRM__bg-gray-900 dark:hover:AIPRM__text-gray-300 hover:AIPRM__bg-gray-50 hover:AIPRM__text-gray-600 AIPRM__inline-block AIPRM__p-4 AIPRM__rounded-t-lg AIPRM__w-full">
              Own
            </a>
          </li>

          ${
            customLists.length
              ? customLists
                  .map(
                    (list) => /*html*/ `
                    <li class="AIPRM__flex-1 AIPRM__mr-2">
                      <a href="#" title="${list.createTitle(
                        this.Client
                      )}" onclick="AIPRM.changePromptTemplatesType('${
                      PromptTemplatesType.CUSTOM_LIST
                    }', '${list.ID}')"
                      class="${
                        this.PromptTemplatesType ===
                          PromptTemplatesType.CUSTOM_LIST &&
                        this.PromptTemplatesList === list.ID
                          ? 'AIPRM__bg-gray-50 dark:AIPRM__bg-white/5'
                          : ''
                      } dark:hover:AIPRM__bg-gray-900 dark:hover:AIPRM__text-gray-300 hover:AIPRM__bg-gray-50 hover:AIPRM__text-gray-600 AIPRM__p-4 AIPRM__rounded-t-lg AIPRM__flex AIPRM__justify-center AIPRM__items-center AIPRM__gap-2 AIPRM__w-full"> 
                      ${
                        list.ListTypeNo === ListTypeNo.TEAM_CUSTOM
                          ? list.HasWriteAccessForTeamMember(
                              this.Client.UserTeamM
                            )
                            ? svg('TeamListSolid')
                            : svg('TeamList')
                          : ''
                      }  ${sanitizeInput(list.Comment)}

                        ${this.createCustomListActions(list)}
                      </a>
                    </li>`
                  )
                  .join('')
              : ''
          }
        
          <li class="AIPRM__flex-1">
            <a href="#" id="hiddenPromptsTab" title="&quot;Hidden&quot; Prompts List" 
            onclick="${
              hiddenList
                ? `AIPRM.changePromptTemplatesType('${PromptTemplatesType.CUSTOM_LIST}', '${hiddenList.ID}')`
                : 'AIPRM.Client.UserQuota.canUseHidden(AIPRM.Lists) ? AIPRM.howToUseHiddenList() : null'
            }" 
            class="${
              hiddenList &&
              this.PromptTemplatesType === PromptTemplatesType.CUSTOM_LIST &&
              this.PromptTemplatesList === hiddenList.ID
                ? 'AIPRM__bg-gray-50 dark:AIPRM__bg-white/5'
                : ''
            } dark:hover:AIPRM__bg-gray-900 dark:hover:AIPRM__text-gray-300 hover:AIPRM__bg-gray-50 hover:AIPRM__text-gray-600 AIPRM__p-4 AIPRM__rounded-t-lg AIPRM__flex AIPRM__justify-center AIPRM__w-full">
              ${svg('EyeSlash')} &nbsp; Hidden
            </a>
          </li>

          <li class="AIPRM__flex-1">
            <a href="#" id="addNewListTab" title="Create New List" 
            onclick="AIPRM.showListCreateModal()" 
            class="AIPRM__rounded AIPRM__flex AIPRM__justify-center AIPRM__items-center AIPRM__m-2 AIPRM__p-2 AIPRM__font-medium AIPRM__text-gray-800 AIPRM__bg-gray-100 hover:AIPRM__bg-gray-200 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-600 dark:AIPRM__text-gray-400 dark:hover:AIPRM__text-white dark:hover:AIPRM__bg-gray-900">
            ${svg('Plus')} &nbsp; Add List
            </a>
          </li>
        </ul>
    
        <div class="AIPRM__grid AIPRM__grid-cols-2 lg:AIPRM__flex AIPRM__flex-row AIPRM__gap-3 AIPRM__items-end AIPRM__justify-between AIPRM__w-full md:last:AIPRM__mb-6 AIPRM__pt-2 AIPRM__stretch AIPRM__text-left AIPRM__text-sm">
          <div>
            <label for="topicSelect" class="AIPRM__block AIPRM__text-sm AIPRM__font-medium">Topic</label>
        
            <select id="topicSelect" class="AIPRM__bg-gray-100 AIPRM__border-0 AIPRM__text-sm AIPRM__rounded AIPRM__block AIPRM__w-full dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-600 dark:AIPRM__placeholder-gray-400 dark:AIPRM__text-white hover:AIPRM__bg-gray-200 focus:AIPRM__ring-0 dark:hover:AIPRM__bg-gray-900">
              <option value="${DefaultPromptTopic}" 
              ${
                this.PromptTopic === DefaultPromptTopic ? 'selected' : ''
              }>All</option>

              ${this.Topics.map(
                (topic) =>
                  /*html*/ `<option value="${sanitizeInput(topic.ID)}" ${
                    this.PromptTopic === topic.ID ? 'selected' : ''
                  }>${sanitizeInput(topic.Label)}</option>`
              ).join('')}
            </select>
          </div>

          <div>
            <label for="activitySelect" class="AIPRM__block AIPRM__text-sm AIPRM__font-medium">Activity</label>
        
            <select id="activitySelect" class="AIPRM__bg-gray-100 AIPRM__border-0 AIPRM__text-sm AIPRM__rounded AIPRM__block AIPRM__w-full dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-600 dark:AIPRM__placeholder-gray-400 dark:AIPRM__text-white hover:AIPRM__bg-gray-200 focus:AIPRM__ring-0 dark:hover:AIPRM__bg-gray-900">
              <option value="${DefaultPromptActivity}" 
              ${
                this.PromptActivity === DefaultPromptActivity ? 'selected' : ''
              }>All</option>

              ${this.getActivities(this.PromptTopic)
                .map(
                  (activity) =>
                    /*html*/ `<option value="${sanitizeInput(activity.ID)}" ${
                      this.PromptActivity === activity.ID ? 'selected' : ''
                    }>${sanitizeInput(activity.Label)}</option>`
                )
                .join('')}
            </select>
          </div>

          <div>
            <label for="sortBySelect" class="AIPRM__block AIPRM__text-sm AIPRM__font-medium">Sort by</label>
        
            <select id="sortBySelect" class="AIPRM__bg-gray-100 AIPRM__border-0 AIPRM__text-sm AIPRM__rounded AIPRM__block AIPRM__w-full dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-600 dark:AIPRM__placeholder-gray-400 dark:AIPRM__text-white hover:AIPRM__bg-gray-200 focus:AIPRM__ring-0 dark:hover:AIPRM__bg-gray-900">
              ${Object.keys(SortModeNo)
                .map(
                  (sortMode) => /*html*/ `
                  <option value="${SortModeNo[sortMode]}" ${
                    this.PromptSortMode === SortModeNo[sortMode]
                      ? 'selected'
                      : ''
                  }>${capitalizeWords(sortMode.replaceAll('_', ' '))}</option>`
                )
                .join('')}
            </select>
          </div>

          <div>
            <label for="modelSelect" class="AIPRM__block AIPRM__text-sm AIPRM__font-medium">Model</label>
        
            <select id="modelSelect" class="AIPRM__bg-gray-100 AIPRM__border-0 AIPRM__text-sm AIPRM__rounded AIPRM__block AIPRM__w-full dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-600 dark:AIPRM__placeholder-gray-400 dark:AIPRM__text-white hover:AIPRM__bg-gray-200 focus:AIPRM__ring-0 dark:hover:AIPRM__bg-gray-900">
              <option value="${DefaultPromptModel}" 
              ${
                this.PromptModel === DefaultPromptModel ? 'selected' : ''
              }>Not specific</option>

              ${this.ModelsActive.map(
                (model) =>
                  /*html*/ `<option value="${sanitizeInput(model.ID)}" ${
                    this.PromptModel === model.ID ? 'selected' : ''
                  }>${sanitizeInput(model.LabelUser)}</option>`
              ).join('')}
            </select>
          </div>

          <div class="AIPRM__whitespace-nowrap AIPRM__flex">
            <button title="Create New Prompt" 
              onclick="event.preventDefault(); AIPRM.createNewPrompt()" 
              class="AIPRM__rounded AIPRM__justify-center AIPRM__items-center AIPRM__hidden lg:AIPRM__inline-block AIPRM__mr-1 AIPRM__p-2 AIPRM__px-2.5 AIPRM__font-medium AIPRM__text-gray-800 AIPRM__bg-gray-100 hover:AIPRM__bg-gray-200 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-600 dark:AIPRM__text-gray-400 dark:hover:AIPRM__text-white dark:hover:AIPRM__bg-gray-900">
              ${svg('Plus')}
            </button>
            <input id="promptSearchInput" type="search" class="AIPRM__bg-gray-100 AIPRM__border-0 AIPRM__text-sm AIPRM__rounded AIPRM__inline-block AIPRM__w-full dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-600 dark:AIPRM__placeholder-gray-400 dark:AIPRM__text-white hover:AIPRM__bg-gray-200 focus:AIPRM__ring-0 lg:AIPRM__w-[260px]" placeholder="Search" 
            value="${sanitizeInput(
              this.PromptSearch
            )}" onfocus="this.value = this.value">
          </div>

          <div class="lg:AIPRM__hidden">
            <button title="Create New Prompt" 
              onclick="event.preventDefault(); AIPRM.createNewPrompt()" 
              class="AIPRM__rounded AIPRM__w-full AIPRM__flex AIPRM__justify-center AIPRM__items-center AIPRM__p-2 AIPRM__font-medium AIPRM__text-gray-800 AIPRM__bg-gray-100 hover:AIPRM__bg-gray-200 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-600 dark:AIPRM__text-gray-400 dark:hover:AIPRM__text-white dark:hover:AIPRM__bg-gray-900">
              ${svg('Plus')} &nbsp; Add Prompt
            </button>
          </div>
        </div>

        ${
          templates.length > this.PromptTemplateSection.pageSize
            ? paginationContainer
            : ''
        }

        ${this.handleNoPromptsInViewMessage(
          currentTemplates,
          isFavoritesListView,
          selectedList
        )}

        <ul class="${css`ul`} AIPRM__grid AIPRM__grid-cols-1 lg:AIPRM__grid-cols-2 ${
      !isSidebarView ? '2xl:AIPRM__grid-cols-4' : ''
    }">
          ${currentTemplates
            .map(
              (template) => /*html*/ `
            <button onclick="AIPRM.selectPromptTemplateByIndex(${
              template.ID
            })" class="${css`card`} AIPRM__relative AIPRM__group">
              ${
                !template.OwnPrompt && !isCustomListView && !isFavoritesListView
                  ? /*html*/ `
                    <div class="AIPRM__absolute AIPRM__top-0 AIPRM__left-0 AIPRM__flex AIPRM__text-gray-400 lg:AIPRM__invisible group-hover:AIPRM__visible">
                      <a title="${
                        template.IsHidden ? 'Unhide' : 'Hide'
                      } this prompt"
                        class="AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" onclick="event.stopPropagation(); ${
                          template.IsHidden
                            ? `AIPRM.removeFromHiddenList(${template.ID})`
                            : `AIPRM.addToHiddenList(${template.ID})`
                        } ">
                        ${svg('Cross')}
                      </a>
                    </div>`
                  : ''
              }

              ${
                isCustomListView &&
                ((template.OwnPrompt &&
                  selectedList.HasWriteAccessForTeamMember(
                    this.Client.UserTeamM
                  )) ||
                  selectedList.OwnList ||
                  selectedList.HasAdminAccessForTeamMember(
                    this.Client.UserTeamM
                  ))
                  ? /*html*/ `
                    <div class="AIPRM__absolute AIPRM__top-0 AIPRM__left-0 AIPRM__flex AIPRM__text-gray-400 lg:AIPRM__invisible group-hover:AIPRM__visible">
                      <a title="Remove this prompt from the list"
                        class="AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" onclick="event.stopPropagation(); AIPRM.removeFromList('${
                          this.PromptTemplatesList
                        }', ${template.ID})">
                        ${svg('Cross')}
                      </a>
                    </div>`
                  : ''
              }

              <div class="AIPRM__flex AIPRM__items-start AIPRM__w-full AIPRM__justify-between">
                <h3 class="${css`h3`}" style="overflow-wrap: anywhere; ${
                template.IsVerified ? 'padding-right: 30px;' : ''
              }">
                  ${sanitizeInput(template.Title)}
                  ${
                    template.IsVerified
                      ? /*html*/ `
                        <span class="AIPRM__ml-1 AIPRM__text-gray-500 dark:AIPRM__text-gray-400 AIPRM__inline-block" 
                              style="vertical-align: sub; transform: translate(20px); margin-left: -20px;" 
                              title="This prompt was reviewed and verified by AIPRM.">
                          ${
                            template.IsVerified
                              ? svg('CheckBadgeSolidLarge')
                              : ''
                          }
                        </span>`
                      : ''
                  }
                </h3>

                <div class="AIPRM__flex AIPRM__gap-4 AIPRM__justify-center lg:AIPRM__gap-1 lg:AIPRM__pl-2 AIPRM__mt-1 AIPRM__right-2 AIPRM__text-gray-400 lg:AIPRM__invisible group-hover:AIPRM__visible">

                  ${
                    !template.OwnPrompt
                      ? /*html*/ `
                      <a title="View prompt template source" class="AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" onclick="event.stopPropagation(); AIPRM.viewPromptTemplateSource(${
                        template.ID
                      })">${svg('Eye')}</a>  
                      <a title="Report this prompt" class="AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" onclick="event.stopPropagation(); AIPRM.showReportPromptModal(${
                        template.ID
                      })">${svg('Report')}</a>    
                      `
                      : ''
                  }
                  
                  ${
                    template.OwnPrompt || this.isAdminMode()
                      ? /*html*/ `
                    <a title="Delete this prompt" class="AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" onclick="event.stopPropagation(); AIPRM.deletePromptTemplate(${
                      template.ID
                    })">${svg('Trash')}</a>
                    <a title="Edit this prompt" class="AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" onclick="event.stopPropagation(); AIPRM.editPromptTemplate(${
                      template.ID
                    })">${svg('Edit')}</a>
                    `
                      : ''
                  }

                  ${
                    template.IsHidden
                      ? ''
                      : /*html*/ `
                        <a title="Add this prompt to list" class="AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" onclick="event.stopPropagation(); AIPRM.addToList(${
                          template.ID
                        })">${svg('SquaresPlus')}</a>
                              
                        <a title="${`${
                          template.IsFavorite
                            ? 'Remove this prompt from'
                            : 'Add this prompt to'
                        } Favorites`}" class="AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" onclick="event.stopPropagation(); ${
                          template.IsFavorite
                            ? `AIPRM.removeFromFavoritesList(${template.ID})`
                            : `AIPRM.addToFavoritesList(${template.ID})`
                        }">${
                          template.IsFavorite ? svg('StarSolid') : svg('Star')
                        }</a>`
                  }
                </div>
              </div>      

              <div class="AIPRM__-mt-0.5 AIPRM__text-gray-500 AIPRM__text-xs AIPRM__pb-1 AIPRM__max-w-full AIPRM__w-full">
                <span title="Topic: ${sanitizeInput(
                  this.getTopicLabel(template.Community)
                )}">
                  ${sanitizeInput(this.getTopicLabel(template.Community))}
                </span>
                / 
                <span title="Activity: ${sanitizeInput(
                  this.getActivityLabel(template.Category)
                )}">
                  ${sanitizeInput(this.getActivityLabel(template.Category))}
                </span>
              </div>

              <div class="AIPRM__text-gray-500 AIPRM__text-xs AIPRM__flex AIPRM__pb-1 AIPRM__max-w-full">
                ${
                  template.PromptTypeNo === PromptTypeNo.PUBLIC
                    ? /*html*/ `<span class="AIPRM__mr-1" title="Public">${svg(
                        'Globe'
                      )}</span>`
                    : template.PromptTypeNo === PromptTypeNo.TEAM
                    ? /*html*/ `<span class="AIPRM__mr-1" title="Team">${svg(
                        'TeamPrompt'
                      )}</span>`
                    : /*html*/ `<span class="AIPRM__mr-1" title="Private">${svg(
                        'Lock'
                      )}</span>`
                }

                ${
                  template.AuthorName
                    ? template.AuthorURL
                      ? /*html*/ `· 
                      <a href="${sanitizeInput(
                        template.AuthorURL
                      )}" class="AIPRM__mx-1 AIPRM__underline AIPRM__overflow-hidden AIPRM__text-ellipsis AIPRM__flex-1 AIPRM__whitespace-nowrap"
                        onclick="event.stopPropagation()"
                        rel="noopener noreferrer" target="_blank"
                      title="Created by ${sanitizeInput(template.AuthorName)}">
                        ${sanitizeInput(template.AuthorName)}
                      </a>`
                      : /* html */ `· <span class="AIPRM__mx-1 AIPRM__overflow-hidden AIPRM__text-ellipsis AIPRM__flex-1 AIPRM__whitespace-nowrap"
                      title="Created by ${sanitizeInput(template.AuthorName)}">
                      ${sanitizeInput(template.AuthorName)}
                    </span>`
                    : ''
                }  
                · 
                <span title="Last updated on ${formatDateTime(
                  template.RevisionTime
                )}" class="AIPRM__mx-1">${formatAgo(
                template.RevisionTime
              )}</span>

                ${
                  template.ForkedFromPromptID
                    ? /*html*/ `· 
                    <a class="AIPRM__mx-1 AIPRM__underline" 
                      onclick="event.stopPropagation()"  
                      href="https://app.aiprm.com/prompts/${template.ForkedFromPromptID}"
                      rel="noopener noreferrer" target="_blank" 
                      title="Forked from Prompt Template ${template.ForkedFromPromptID}">
                      Forked From
                    </a>`
                    : ''
                }
              </div>
              
              <p class="${css`p`} AIPRM__text-gray-600 dark:AIPRM__text-gray-200 AIPRM__overflow-hidden AIPRM__text-ellipsis" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;"
                title="${sanitizeInput(template.Teaser)}">
                ${
                  this.templateRequiresLiveCrawling(template)
                    ? /*html*/ `
                      <span class="AIPRM__bg-green-100 AIPRM__text-green-800 AIPRM__text-xs AIPRM__font-medium AIPRM__mr-1 AIPRM__px-1.5 AIPRM__py-0.5 AIPRM__rounded dark:AIPRM__bg-green-900 dark:AIPRM__text-green-300" title="This prompt is utilizing AIPRM Live Crawling feature.">Live Crawling</span>
                    `
                    : ''
                }

                ${(template.ModelS || [])
                  .map((modelID) => {
                    if (template.OwnPrompt) {
                      const model = this.Models?.find((m) => m.ID === modelID);
                      if (!model) return '';

                      const modelLabelUser = model?.LabelUser;
                      const modelLabelAuthor = model?.LabelAuthor;
                      const modelStatusClass =
                        model?.StatusNo === ModelStatusNo.ACTIVE
                          ? 'AIPRM__bg-green-100 AIPRM__text-green-800 dark:AIPRM__bg-green-900 dark:AIPRM__text-green-300'
                          : 'AIPRM__bg-yellow-100 AIPRM__text-yellow-800 dark:AIPRM__bg-yellow-900 dark:AIPRM__text-yellow-300';

                      return model
                        ? /*html*/ `
                      <span class="AIPRM__text-xs AIPRM__font-medium AIPRM__mr-1 AIPRM__px-1.5 AIPRM__py-0.5 AIPRM__rounded ${modelStatusClass}" title="This prompt is optimized for ${sanitizeInput(
                            modelLabelAuthor
                          )}${
                            model?.StatusNo !== ModelStatusNo.ACTIVE
                              ? ' (Deprecated)'
                              : ''
                          }">${sanitizeInput(modelLabelUser)}</span>
                      `
                        : '';
                    } else {
                      const model = this.ModelsActive?.find(
                        (m) => m.ID === modelID
                      );
                      if (!model) return '';

                      const modelLabelUser = model?.LabelUser;
                      const modelLabelAuthor = model?.LabelAuthor;

                      return model
                        ? /*html*/ `
                      <span class="AIPRM__bg-green-100 AIPRM__text-green-800 AIPRM__text-xs AIPRM__font-medium AIPRM__mr-1 AIPRM__px-1.5 AIPRM__py-0.5 AIPRM__rounded dark:AIPRM__bg-green-900 dark:AIPRM__text-green-300" title="This prompt is optimized for ${sanitizeInput(
                        modelLabelAuthor
                      )}">${sanitizeInput(modelLabelUser)}</span>
                      `
                        : '';
                    }
                  })
                  .join('')}

                ${sanitizeInput(template.Teaser)}
              </p>

            <div class="AIPRM__text-gray-500 AIPRM__text-xs AIPRM__flex AIPRM__pt-3 AIPRM__w-full AIPRM__justify-between AIPRM__mt-auto">
                <span class="AIPRM__flex AIPRM__items-center" title="Views (${
                  template.Views
                })">
                  <span class="AIPRM__p-1">${svg(
                    'Eye'
                  )}</span> &nbsp; ${formatHumanReadableNumber(template.Views)}
                </span>

                <span class="AIPRM__flex AIPRM__items-center" title="Usages (${
                  template.Usages
                })">
                  <span class="AIPRM__p-1">${svg(
                    'Quote'
                  )}</span> &nbsp; ${formatHumanReadableNumber(template.Usages)}
                </span>

                <span class="AIPRM__flex AIPRM__items-center" title="Votes (${
                  template.Votes
                })">
                  ${
                    !template.OwnPrompt
                      ? /*html*/ `<a title="Votes (${
                          template.Votes
                        }) - Vote for this prompt with thumbs up"
                        class="AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" onclick="event.stopPropagation(); AIPRM.voteThumbsUp(${
                          template.ID
                        })">${svg('ThumbUp')}</a>`
                      : /*html*/ `${svg('ThumbUp')}`
                  }
                  &nbsp; ${formatHumanReadableNumber(template.Votes)}

                  ${
                    !template.OwnPrompt
                      ? /*html*/ `&nbsp; <a title="Votes (${
                          template.Votes
                        }) - Vote for this prompt with thumbs down"
                        class="AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" onclick="event.stopPropagation(); AIPRM.voteThumbsDown(${
                          template.ID
                        })">${svg('ThumbDown')}</a>`
                      : ''
                  }
                </span>

                <span class="AIPRM__flex AIPRM__items-center" title="Copy link to this prompt">
                  <a class="AIPRM__p-1 AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" 
                  onclick="event.stopPropagation(); AIPRM.copyPromptDeepLink(${
                    template.ID
                  })" title="Copy link to this prompt">
                  ${svg('Link')}
                  </a>
                </span>
            </div>
            
          </button>
        `
            )
            .join('')}
              
          ${
            this.PromptTemplatesType !== PromptTemplatesType.CUSTOM_LIST ||
            selectedList.ListTypeNo === ListTypeNo.CUSTOM ||
            (selectedList.ListTypeNo === ListTypeNo.TEAM_CUSTOM &&
              selectedList.HasWriteAccessForTeamMember(this.Client.UserTeamM))
              ? /*html*/ `<button onclick="AIPRM.createNewPrompt()" class="${css`card`} AIPRM__relative AIPRM__group AIPRM__justify-center AIPRM__items-center">
              <div class="AIPRM__flex AIPRM__items-center AIPRM__gap-3">
                ${svg('Plus')}
                ${
                  this.PromptTemplatesType === PromptTemplatesType.PUBLIC
                    ? 'Add Public Prompt'
                    : this.PromptTemplatesType === PromptTemplatesType.OWN
                    ? 'Add Private Prompt'
                    : selectedList.ListTypeNo === ListTypeNo.CUSTOM
                    ? 'Add Private Prompt'
                    : 'Add Team Prompt'
                }
              </div>
            </button>`
              : ''
          }
        </ul>
    
        ${
          templates.length > this.PromptTemplateSection.pageSize
            ? paginationContainer
            : ''
        }

      </ul>
      
    </div>
   `;

    let wrapper = document.createElement('div');
    wrapper.id = 'templates-wrapper';
    wrapper.className =
      'AIPRM__mt-6 md:AIPRM__flex AIPRM__items-start AIPRM__text-center AIPRM__gap-2.5 AIPRM__max-w-full AIPRM__m-auto sm:AIPRM__mx-4 AIPRM__text-sm';

    if (parent.querySelector('#templates-wrapper')) {
      wrapper = parent.querySelector('#templates-wrapper');
    } else {
      parent.appendChild(wrapper);
    }

    wrapper.innerHTML = html;

    // Add event listeners for topic, activity, sort by select, search input and prompts per page select
    wrapper
      .querySelector('#topicSelect')
      .addEventListener('change', this.changePromptTopic.bind(this));

    wrapper
      .querySelector('#activitySelect')
      .addEventListener('change', this.changePromptActivity.bind(this));

    wrapper
      .querySelector('#sortBySelect')
      .addEventListener('change', this.changePromptSortBy.bind(this));

    wrapper
      .querySelector('#modelSelect')
      .addEventListener('change', this.changePromptModel.bind(this));

    wrapper
      .querySelector('#promptSearchInput')
      .addEventListener(
        'input',
        this.debounce(this.changePromptSearch.bind(this), 300).bind(this)
      );

    const pageSizeSelectElements = wrapper.querySelectorAll(
      'select.pageSizeSelect'
    );

    // Remove event listener for the pagination buttons (if not needed/already added)
    document.removeEventListener('keydown', this.boundHandleArrowKey);

    // Add event listener for the pagination buttons and page size select elements
    if (pageSizeSelectElements.length > 0) {
      pageSizeSelectElements.forEach((select) => {
        select.addEventListener('change', this.changePromptPageSize.bind(this));
      });

      // Add event listener for the pagination buttons
      document.addEventListener('keydown', this.boundHandleArrowKey);
    }
  },

  /**
   * @param {Prompt[]} currentTemplates
   * @param {boolean} isFavoritesListView
   * @param {List} selectedList
   */
  handleNoPromptsInViewMessage(
    currentTemplates,
    isFavoritesListView,
    selectedList
  ) {
    // there are prompts in the current view
    if (currentTemplates.length > 0) {
      return '';
    }

    if (
      this.PromptTopic != DefaultPromptTopic ||
      this.PromptActivity != DefaultPromptActivity ||
      this.PromptModel != DefaultPromptModel ||
      this.PromptSearch != ''
    ) {
      return /*html*/ `
        <div class="AIPRM__w-full AIPRM__my-8">
          <div class="AIPRM__font-semibold AIPRM__text-xl">No prompts found for your current filter.</div>
          <div>Please reset your filters to view all prompts.</div>
          <a class="AIPRM__underline" href="#" title="Reset filters" onclick="event.stopPropagation(); AIPRM.resetFilters();">Click here to reset filters</a>
        </div>
      `;
    }

    if (this.PromptTemplatesType === PromptTemplatesType.OWN) {
      return /*html*/ `
        <div class="AIPRM__w-full AIPRM__my-8">
          <div class="AIPRM__font-semibold AIPRM__text-xl">You do not have any own prompts at the moment.</div>
          <a class="AIPRM__underline" href="#" title="Create New Prompt" onclick="event.preventDefault(); AIPRM.createNewPrompt()">Click here to create your own prompt</a>
        </div>`;
    }

    if (this.PromptTemplatesType === PromptTemplatesType.CUSTOM_LIST) {
      const hiddenList = this.Lists.getHidden();

      if (hiddenList && this.PromptTemplatesList === hiddenList.ID) {
        return /*html*/ `
          <div class="AIPRM__w-full AIPRM__my-8 AIPRM__inline_svg">
            <div class="AIPRM__font-semibold AIPRM__text-xl">This list doesn't have any prompts at the moment.</div>
            Add existing public prompt to Hidden list using ${svg(
              'Cross'
            )} icon next to the public prompt title.
          </div>`;
      } else if (isFavoritesListView) {
        return /*html*/ `
        <div class="AIPRM__w-full AIPRM__my-8 AIPRM__inline_svg">
          <div class="AIPRM__font-semibold AIPRM__text-xl">This list doesn't have any prompts at the moment.</div>
          Add existing prompt to Favorites list using ${svg(
            'Star'
          )} icon next to the prompt title.
        </div>`;
      } else if (
        selectedList &&
        (selectedList.ListTypeNo === ListTypeNo.AIPRM_VERIFIED ||
          selectedList.ListTypeNo === ListTypeNo.CUSTOM ||
          selectedList.HasWriteAccessForTeamMember(this.Client.UserTeamM))
      ) {
        return /*html*/ `
        <div class="AIPRM__w-full AIPRM__my-8 AIPRM__inline_svg">
          <div class="AIPRM__font-semibold AIPRM__text-xl">This list doesn't have any prompts at the moment.</div>
          <a class="AIPRM__underline" href="#" title="Create New Prompt" onclick="event.preventDefault(); AIPRM.createNewPrompt()">Click here to create your own prompt</a> or add existing prompt to this list using ${svg(
            'SquaresPlus'
          )} icon next to the prompt title.
        </div>`;
      } else {
        return /*html*/ `
        <div class="AIPRM__w-full AIPRM__my-8 AIPRM__inline_svg">
          <div class="AIPRM__font-semibold AIPRM__text-xl">This list doesn't have any prompts at the moment.</div>
          Only Team Owner, Team Admin or Team User with Read-Write access can add prompts to this list.
        </div>`;
      }
    }
  },

  /** @param {List} list */
  createCustomListActions(list) {
    if (
      this.PromptTemplatesType !== PromptTemplatesType.CUSTOM_LIST ||
      this.PromptTemplatesList !== list.ID
    ) {
      return '';
    }

    return /*html*/ `
        <div class="AIPRM__dropdown">
          <button class="AIPRM__align-middle AIPRM__pl-2">
            ${svg('EllipsisVertical')}
          </button>

          <ul title="" class="AIPRM__dropdown-menu AIPRM__hidden AIPRM__z-50 AIPRM__border AIPRM__bg-white AIPRM__absolute AIPRM__text-left AIPRM__cursor-pointer AIPRM__rounded-xl AIPRM__border-gray-100 dark:AIPRM__bg-gray-900 dark:AIPRM__border-gray-800 dark:AIPRM__shadow-xs dark:AIPRM__text-gray-100 AIPRM__shadow-xxs AIPRM__py-2">
            ${
              list.ListTypeNo === ListTypeNo.CUSTOM ||
              list.HasAdminAccessForTeamMember(this.Client.UserTeamM)
                ? /* html */ `<li class="AIPRM__flex AIPRM__items-center AIPRM__py-2 AIPRM__px-4 hover:!AIPRM__bg-gray-50 dark:hover:!AIPRM__bg-gray-700 AIPRM__text-gray-800 dark:AIPRM__text-gray-100" onclick="event.stopPropagation(); AIPRM.editCustomList('${
                    list.ID
                  }')">${svg('Edit')}&nbsp;Rename List</li>`
                : ''
            }

            ${
              this.Client.UserQuota?.hasTeamsFeatureEnabled() &&
              (list.ListTypeNo === ListTypeNo.CUSTOM ||
                list.HasOwnerAccessForTeamMember(this.Client.UserTeamM))
                ? /*html*/ `
                <li class="AIPRM__flex AIPRM__items-center AIPRM__py-2 AIPRM__px-4 hover:!AIPRM__bg-gray-50 dark:hover:!AIPRM__bg-gray-700 AIPRM__text-gray-800 dark:AIPRM__text-gray-100" onclick="event.stopPropagation();AIPRM.toggleTeamList('${
                  list.ID
                }');">
                  ${
                    list.ListTypeNo === ListTypeNo.TEAM_CUSTOM
                      ? /* html */ `${svg('Lock')}&nbsp;Make List Private`
                      : /* html */ `${svg('Share')}&nbsp;Share with Team`
                  }
                </li>
                `
                : ''
            }

            ${
              list.ListTypeNo === ListTypeNo.CUSTOM ||
              list.HasAdminAccessForTeamMember(this.Client.UserTeamM)
                ? /* html */ `<li class="AIPRM__flex AIPRM__items-center AIPRM__py-2 AIPRM__px-4 hover:!AIPRM__bg-red-100 dark:hover:!AIPRM__bg-red-500/50 AIPRM__text-gray-800 dark:AIPRM__text-gray-100" onclick="event.stopPropagation(); AIPRM.deleteCustomList('${
                    list.ID
                  }')">${svg('Trash')}&nbsp;Delete List</li>`
                : ''
            }

            ${
              list.ListTypeNo === ListTypeNo.TEAM_CUSTOM
                ? list.HasAdminAccessForTeamMember(this.Client.UserTeamM)
                  ? /* html */ `
                <div class="AIPRM__my-1.5 AIPRM__h-px AIPRM__bg-gray-100 dark:AIPRM__bg-white/20" role="none"></div>
                <li class="AIPRM__flex AIPRM__items-center AIPRM__py-2 AIPRM__px-4 hover:!AIPRM__bg-gray-50 dark:hover:!AIPRM__bg-gray-700 AIPRM__text-gray-800 dark:AIPRM__text-gray-100" onclick="event.stopPropagation();window.open('${AppTeamURL}/${
                      list.ForTeamID
                    }')">${svg('TeamPrompt')}&nbsp;Manage Team</li>`
                  : /* html */ `
                <li class="AIPRM__flex AIPRM__items-center AIPRM__py-2 AIPRM__px-4 hover:!AIPRM__bg-gray-50 dark:hover:!AIPRM__bg-gray-700 AIPRM__text-gray-800 dark:AIPRM__text-gray-100" onclick="event.stopPropagation();window.open('${AppTeamURL}/${
                      list.ForTeamID
                    }')">${svg('TeamPrompt')}&nbsp;View Team</li>`
                : ''
            }
          </ul>
        </div>
    `;
  },

  /** @param {List['ID']} listID */
  toggleTeamList(listID) {
    const list = this.Lists.withID(listID);

    if (list.ListTypeNo === ListTypeNo.TEAM_CUSTOM) {
      this.switchListToPrivateList(list);
    } else {
      this.switchListToTeamList(listID);
    }
  },

  /** @param {List} list */
  async switchListToPrivateList(list) {
    // Ask for confirmation
    if (
      !confirm(
        `Are you sure you want to make list "${sanitizeInput(
          list.Comment
        )}" private and stop sharing it with your Team?`
      )
    ) {
      return;
    }

    try {
      // Update the list using the API and update it in the local list of lists
      await list.updateListType(ListTypeNo.CUSTOM, null);
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not update list. ${
          error instanceof Reaction ? error.message : ''
        }`
      );
      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      `Updated prompts list "${sanitizeInput(list.Comment)}".`
    );

    this.insertPromptTemplatesSection();
  },

  /** @param {List['ID']} listID */
  async switchListToTeamList(listID) {
    let shareListWithTeamModal = document.getElementById(
      'shareListWithTeamModal'
    );

    // if modal does not exist, create it, add event listener on submit and append it to body
    if (!shareListWithTeamModal) {
      shareListWithTeamModal = document.createElement('div');
      shareListWithTeamModal.id = 'shareListWithTeamModal';

      shareListWithTeamModal.addEventListener(
        'submit',
        this.shareListWithTeam.bind(this, listID)
      );

      document.body.appendChild(shareListWithTeamModal);
    }

    shareListWithTeamModal.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__text-center AIPRM__transition-opacity AIPRM__z-50">
      <div class="AIPRM__absolute AIPRM__bg-gray-900 AIPRM__inset-0 AIPRM__opacity-90">
      </div>

      <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__overflow-y-auto">
        <div class="AIPRM__flex AIPRM__items-center AIPRM__justify-center AIPRM__min-h-full">
          <form>
            <div
              class="AIPRM__align-center AIPRM__bg-white dark:AIPRM__bg-gray-800 dark:AIPRM__text-gray-200 AIPRM__inline-block AIPRM__overflow-hidden sm:AIPRM__rounded-lg AIPRM__shadow-xl sm:AIPRM__align-middle sm:AIPRM__max-w-lg sm:AIPRM__my-8 sm:AIPRM__w-full AIPRM__text-left AIPRM__transform AIPRM__transition-all"
              role="dialog" aria-modal="true" aria-labelledby="modal-headline">

              <div class="AIPRM__bg-white dark:AIPRM__bg-gray-800 AIPRM__px-4 AIPRM__pt-5 AIPRM__pb-4 sm:AIPRM__p-6 sm:AIPRM__pb-4 AIPRM__w-96">
                <label>Share with Team</label>
                <select id="shareListWithTeamSelectTeam" name="shareListWithTeamSelectTeam" class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full">
                  ${
                    this.Client.OwnTeamS?.length > 0
                      ? this.Client.OwnTeamS.map(
                          (team) =>
                            /*html*/ `<option value="${sanitizeInput(
                              team.TeamID
                            )}">${sanitizeInput(team.TeamName)}</option>`
                        ).join('')
                      : /*html*/ `<option value="NEW">My First Team</option>`
                  }
                </select>

                ${
                  this.Client.OwnTeamS?.length > 0
                    ? /*html*/ `<a href="${AppTeamURL}" target="blank" class="AIPRM__text-sm AIPRM__text-gray-500 AIPRM__underline">Manage My Teams</a>`
                    : ''
                }
              </div>

              <div class="AIPRM__bg-gray-200 dark:AIPRM__bg-gray-700 AIPRM__px-4 AIPRM__py-3 AIPRM__text-right">
                <button type="button" class="AIPRM__bg-gray-600 hover:AIPRM__bg-gray-800 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white"
                        onclick="AIPRM.hideShareListWithTeamModal()"> Cancel
                </button>
                <button type="submit" class="AIPRM__bg-green-600 hover:AIPRM__bg-green-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white">Share with Team</button>
              </div>
            </div>
          </form>
        </div>
      </div>

    </div>
    `;

    shareListWithTeamModal.style = 'display: block;';

    // add event listener to close the modal on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideShareListWithTeamModal();
      }
    });
  },

  hideShareListWithTeamModal() {
    this.hideModal('shareListWithTeamModal');
  },

  /**
   * @param {List['ID']} listID
   * @param {Event} e
   */
  async shareListWithTeam(listID, e) {
    e.preventDefault();

    const list = this.Lists.withID(listID);

    const formData = new FormData(e.target);
    const forTeamID = formData.get('shareListWithTeamSelectTeam');

    try {
      // Update the list using the API and update it in the local list of lists
      await list.updateListType(ListTypeNo.TEAM_CUSTOM, forTeamID);
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not update list. ${
          error instanceof Reaction ? error.message : ''
        }`
      );
      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      `Updated prompts list "${sanitizeInput(list.Comment)}".`
    );

    if (forTeamID === 'NEW') {
      // refresh teams
      await this.Client.checkUserStatus();
    }

    this.hideShareListWithTeamModal();

    await this.insertPromptTemplatesSection();
  },

  async resetFilters() {
    const topicReset = this.PromptTopic != DefaultPromptTopic;

    this.PromptTopic = DefaultPromptTopic;
    this.PromptActivity = DefaultPromptActivity;
    this.PromptSearch = '';
    this.PromptTemplateSection.currentPage = 0;

    this.PromptModel = DefaultPromptModel;
    localStorage.setItem(lastPromptModelKey, this.PromptModel);

    if (topicReset) {
      await this.selectPromptTemplateByIndex(null);

      localStorage.setItem(lastPromptTopicKey, this.PromptTopic);

      this.fetchPromptTemplates();

      this.fetchMessages();
    } else {
      await this.insertPromptTemplatesSection();
    }
  },

  /**
   * boundHandleArrowKey is the bound version of the handleArrowKey function
   *
   * @type {function(e: KeyboardEvent): void}
   */
  boundHandleArrowKey: null,

  // handleArrowKey handles the arrow key presses for the page navigation
  async handleArrowKey(e) {
    const isArrowKey = e.key === 'ArrowLeft' || e.key === 'ArrowRight';

    const isInput =
      e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

    if (!isArrowKey || isInput) {
      // If the key pressed is not an arrow key or if it was pressed in an input or textarea element, do nothing
      return;
    }

    // If the key pressed is a left arrow key, call the previous page function
    if (e.key === 'ArrowLeft') {
      await this.prevPromptTemplatesPage();

      return;
    }

    // Otherwise, call the next page function
    await this.nextPromptTemplatesPage();
  },

  // changePromptPageSize updates the this.PromptTemplateSection.pageSize variable and re-renders the templates
  async changePromptPageSize(e) {
    let pageSize = +e.target.value;

    // if the pageSize is not in the pageSizeOptions array, use the default pageSize option
    pageSize = pageSizeOptions.includes(pageSize) ? pageSize : pageSizeDefault;

    // persist the last selected page size in local storage
    localStorage.setItem(lastPageSizeKey, pageSize);

    this.PromptTemplateSection.currentPage = 0;
    this.PromptTemplateSection.pageSize = pageSize;

    await this.insertPromptTemplatesSection();
  },

  // changePromptTopic updates the this.PromptTopic variable and reloads the templates & messages
  async changePromptTopic(e) {
    this.PromptTopic = e.target.value;

    this.PromptActivity = DefaultPromptActivity;

    this.PromptTemplateSection.currentPage = 0;

    await this.selectPromptTemplateByIndex(null);

    // persist the last selected topic in local storage
    localStorage.setItem(lastPromptTopicKey, this.PromptTopic);

    this.fetchPromptTemplates();

    this.fetchMessages();
  },

  // changePromptActivity updates the this.PromptActivity variable and re-renders the templates
  async changePromptActivity(e) {
    this.PromptActivity = e.target.value;

    this.PromptTemplateSection.currentPage = 0;

    await this.insertPromptTemplatesSection();
  },

  // changePromptSortBy updates the this.PromptSortMode variable and reloads the templates
  changePromptSortBy(e) {
    this.PromptSortMode = +e.target.value;

    this.PromptTemplateSection.currentPage = 0;

    this.fetchPromptTemplates();
  },

  // changePromptModel updates the this.PromptModel variable and reloads the templates
  async changePromptModel(e) {
    this.PromptModel = e.target.value;

    this.PromptTemplateSection.currentPage = 0;

    // persist the last selected model in local storage
    localStorage.setItem(lastPromptModelKey, this.PromptModel);

    await this.insertPromptTemplatesSection();
  },

  // changePromptSearch updates the this.PromptSearch variable and re-renders the templates
  async changePromptSearch(e) {
    this.PromptSearch = e.target.value;

    this.PromptTemplateSection.currentPage = 0;

    await this.insertPromptTemplatesSection();

    const searchInput = document.querySelector('#promptSearchInput');

    searchInput.selectionStart = searchInput.selectionEnd =
      searchInput.value.length;
    searchInput.focus();
  },
  /**
   * changePromptTemplatesType updates PromptTemplatesType and PromptTemplatesList and re-renders the templates
   *
   * @param {PromptTemplatesType} type
   * @param {import('./client.js').List['ID']} listID
   */
  async changePromptTemplatesType(type, listID = null) {
    if (
      this.PromptTemplatesType === type &&
      this.PromptTemplatesList === listID
    ) {
      return;
    }

    this.PromptTemplatesType = type;

    this.PromptTemplatesList = listID;

    this.PromptTemplateSection.currentPage = 0;

    // persist the last selected prompt template type and listID in local storage
    localStorage.setItem(lastPromptTemplateTypeKey, type);
    localStorage.setItem(lastListIDKey, listID);

    await this.insertPromptTemplatesSection();
  },

  // debounce is a function that returns a function that will only execute after a certain amount of time has passed
  debounce(callback, milliseconds) {
    let timeout;

    return (argument) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(argument), milliseconds);
    };
  },

  // Insert language select and continue button above the prompt textarea input
  insertLanguageToneWritingStyleContinueActions() {
    let wrapper = document.createElement('div');

    wrapper.id = 'language-select-wrapper';
    wrapper.className = css('languageSelectWrapper');

    // Get the list of languages
    const languages = this.Languages;

    // If there are no languages, skip
    if (!languages) {
      console.error('insertLanguageSelect: No languages found');
      return;
    }

    const selectorConfig = this.Config.getSelectorConfig();

    // Get the prompt textarea input
    const textarea = document.querySelector(selectorConfig.PromptTextarea);

    // If there is no textarea, skip
    if (!textarea) {
      console.error('insertLanguageSelect: No textarea found');
      return;
    }

    // Hide the spacer for absolutely positioned prompt input
    const spacer = document.querySelector(selectorConfig.LangWrapperSpacer);

    if (spacer) {
      spacer.style = 'display: none';
    }

    // Remove the absolute positioning from the prompt input parent
    const formParent = textarea.form.parentElement;

    if (formParent) {
      formParent.classList.remove(
        'absolute',
        'md:!bg-transparent',
        'md:border-t-0',
        'md:dark:border-transparent',
        'md:border-transparent'
      );
    }

    // Get the parent of the textarea
    const parent = textarea.parentElement;

    // If there is no parent element, skip
    if (!parent) {
      console.error('insertLanguageSelect: No parent element found');
      return;
    }

    // Add padding to the parent element
    parent.classList.add('AIPRM__pr-4');

    // Get existing language select wrapper or create a new one
    if (parent.querySelector(`#${wrapper.id}`)) {
      wrapper = parent.querySelector(`#${wrapper.id}`);
    } else {
      parent.prepend(wrapper);
    }

    // Create the HTML for the language select section
    wrapper.innerHTML = /*html*/ `
    <div class="AIPRM__flex AIPRM__w-full">
      <div>
        <label for="languageSelect" class="${css(
          'selectLabel'
        )} AIPRM__whitespace-nowrap">Output in</label>
        
        <select id="languageSelect" class="${css('select')}">
          <option value ${
            !this.TargetLanguage ? ' selected' : ''
          }>Default language</option>  

          ${this.Languages.map(
            (language) => `
            <option value="${language.languageEnglish}" ${
              this.TargetLanguage === language.languageEnglish
                ? ' selected'
                : ''
            }>
              ${language.languageLabel}
              </option> 
          `
          ).join('')}
        </select>
      </div>
      
      <div class="AIPRM__ml-2">
        <label for="toneSelect" class="${css('selectLabel')}">Tone</label>
      
        <select id="toneSelect" class="${css('select')}">
          <option value ${!this.Tone ? ' selected' : ''}>Default</option>

          ${this.Tones.filter((tone) =>
            this.Client.UserQuota.canUseCustomTone(tone)
          )
            .map(
              (tone) => `
            <option value="${tone.ID}" ${
                this.Tone === tone.ID ? ' selected' : ''
              }>
              ${tone.Label}
              </option> 
          `
            )
            .join('')}

          ${
            !this.Client.UserQuota.canUseCustomTone()
              ? '<option value disabled>_________</option><option value="UPGRADE">Upgrade for more</option>'
              : ''
          }
        </select>
      </div>

      <div class="AIPRM__ml-2">
        <label for="writingStyleSelect" class="${css(
          'selectLabel'
        )} AIPRM__whitespace-nowrap">Writing Style</label>
      
        <select id="writingStyleSelect" class="${css('select')}">
          <option value ${
            !this.WritingStyle ? ' selected' : ''
          }>Default</option>

          ${this.WritingStyles.filter((writingStyle) =>
            this.Client.UserQuota.canUseCustomWritingStyle(writingStyle)
          )
            .map(
              (writingStyle) => `
            <option value="${writingStyle.ID}" ${
                this.WritingStyle === writingStyle.ID ? ' selected' : ''
              }>
              ${writingStyle.Label}
              </option> 
          `
            )
            .join('')}

          ${
            !this.Client.UserQuota.canUseCustomWritingStyle()
              ? '<option value disabled>_________</option><option value="UPGRADE">Upgrade for more</option>'
              : ''
          }
        </select>
      </div>
    </div>

    <div class="AIPRM__inline-flex AIPRM__invisible" role="group" id="continueActionsGroup">
      <button id="continueWritingButton" title="Continue writing please" class="${css(
        'continueButton'
      )}" onclick="event.stopPropagation(); AIPRM.continueWriting()" type="button">
        Continue
      </button>

      <select id="continueActionSelect" class="${css('continueActionSelect')}">
        <option value selected disabled>-- Select an action --</option>

        ${this.ContinueActions.map(
          (action) => `
          <option value="${action.ID}" ${
            !this.Client.UserQuota.canUsePowerContinue() ? 'disabled' : ''
          }>${action.Label}</option>
        `
        ).join('')}

        ${
          !this.Client.UserQuota.canUsePowerContinue()
            ? '<option value disabled>_________</option><option value="UPGRADE">Upgrade to activate</option>'
            : ''
        }
      </select>
    </div>
  `;

    // Add event listener to language select to update the target language on change
    wrapper
      .querySelector('#languageSelect')
      .addEventListener('change', this.changeTargetLanguage.bind(this));

    // Add event listener to tone select to update the tone on change
    wrapper
      .querySelector('#toneSelect')
      .addEventListener('change', this.changeTone.bind(this));

    // Add event listener to writing style select to update the writing style on change
    wrapper
      .querySelector('#writingStyleSelect')
      .addEventListener('change', this.changeWritingStyle.bind(this));

    // Add event listener to continue action select to update the continue action on change
    wrapper
      .querySelector('#continueActionSelect')
      .addEventListener('change', this.changeContinueAction.bind(this));
  },

  // Insert the "Include My Profile info" below prompt textarea
  insertIncludeMyProfileInfo() {
    const selectorConfig = this.Config.getSelectorConfig();

    // Get the prompt textarea input
    const textarea = document.querySelector(selectorConfig.PromptTextarea);

    // If there is no textarea, skip
    if (!textarea) {
      console.error('insertMyProfileInfo: No textarea found');
      return;
    }

    // select last button element for parent element of textarea
    let button = document.querySelector(selectorConfig.PromptSubmitButton);

    // If the button is not found, skip
    if (
      !button ||
      !button.tagName ||
      button.tagName.toLowerCase() !== 'button'
    ) {
      console.error('insertMyProfileInfo: No button found');
      return;
    }

    let wrapper = document.querySelector('#includeMyProfile');
    let wrapperClassName =
      'AIPRM__mt-4 AIPRM__pl-10 AIPRM__pr-10 AIPRM__-mb-1.5 AIPRM__text-right AIPRM__whitespace-nowrap';

    // Create the wrapper if it doesn't exist
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = wrapperClassName;
      wrapper.id = 'includeMyProfile';

      // Insert the wrapper after the submit button
      button.parentNode.insertBefore(wrapper, button.nextSibling);
    }

    // Hide for not linked accounts
    wrapper.className = wrapperClassName;
    if (!this.Client.User.IsLinked) {
      wrapper.className = 'AIPRM__hidden';
      this.SelectedMyProfileInfoID = null;
    }

    // Insert the checkbox
    wrapper.innerHTML = /*html*/ `
      <label class="AIPRM__text-sm AIPRM__items-center AIPRM__mx-2"
        title="Include provided &quot;My Profile&quot; info that you would like ChatGPT to know and remember about you and your preferences.">
        <input name="includeMyProfile" type="checkbox" class="AIPRM__mr-2 dark:AIPRM__bg-gray-700" 
          ${this.IncludeMyProfileMessage ? 'checked' : ''} ${
      this.MyProfileInfos.length > 0 ? '' : 'disabled'
    } />
        Include <a class="AIPRM__underline AIPRM__cursor-pointer" title="Manage My Profile Info" href="${AppAccountURL}#myprofileinfo" target="_blank">My Profile Info</a>:
      </label>

      <div id="includeMyProfileInfoSelectWrapper" class="AIPRM__inline-block AIPRM__group">
        <select id="includeMyProfileInfoSelect" class="AIPRM__bg-gray-100 AIPRM__border-0 AIPRM__text-sm AIPRM__rounded dark:AIPRM__bg-gray-600 dark:AIPRM__border-gray-600 dark:group-hover:AIPRM__bg-gray-900 dark:AIPRM__placeholder-gray-400 dark:AIPRM__text-white group-hover:AIPRM__bg-gray-200 focus:AIPRM__ring-0 sm:AIPRM__max-w-xs AIPRM__max-w-[6rem] ${
          !this.MyProfileInfos.length ? 'AIPRM__pointer-events-none' : ''
        }" 
          ${this.IncludeMyProfileMessage ? '' : 'disabled'}>
          ${
            this.MyProfileInfos.length > 0
              ? this.MyProfileInfos.map(
                  (myProfileInfo) => `
            <option value="${myProfileInfo.ID}" ${
                    myProfileInfo.ID === this.SelectedMyProfileInfoID
                      ? 'selected'
                      : ''
                  }>
              ${sanitizeInput(myProfileInfo.Label)}
            </option> 
          `
                ).join('')
              : `<option value="" selected disabled>No Profile Info found</option>`
          }
        </select>
      </div>
     `;

    const selectWrapper = wrapper.querySelector(
      '#includeMyProfileInfoSelectWrapper'
    );

    // add on click event listener to includeMyProfileInfoSelectWrapper if there are no options, otherwise remove it
    if (!this.MyProfileInfos.length) {
      selectWrapper.addEventListener('click', this.openMyProfileInfoSettings);
    } else {
      selectWrapper.removeEventListener(
        'click',
        this.openMyProfileInfoSettings
      );
    }

    const includeMyProfileInfoSelect = wrapper.querySelector(
      '#includeMyProfileInfoSelect'
    );

    wrapper.querySelector('input').addEventListener('change', (event) => {
      this.IncludeMyProfileMessage = event.target.checked;

      if (this.IncludeMyProfileMessage && this.MyProfileInfos.length > 0) {
        if (includeMyProfileInfoSelect.value === '') {
          this.SelectedMyProfileInfoID = this.MyProfileInfos[0].ID;
          includeMyProfileInfoSelect.value = this.SelectedMyProfileInfoID;
        }

        this.SelectedMyProfileInfoID = parseInt(
          includeMyProfileInfoSelect.value
        );

        includeMyProfileInfoSelect.disabled = false;
      } else {
        includeMyProfileInfoSelect.disabled = true;
      }

      try {
        localStorage.setItem(
          includeMyProfileInfoKey,
          this.IncludeMyProfileMessage
        );
        localStorage.setItem(
          selectedMyProfileInfoKey,
          this.SelectedMyProfileInfoID
        );
      } catch (error) {
        console.error(error);
      }
    });

    // Add event listener to checkbox to update the include my profile info on change
    includeMyProfileInfoSelect.addEventListener('change', (event) => {
      this.SelectedMyProfileInfoID = parseInt(event.target.value);

      try {
        localStorage.setItem(
          selectedMyProfileInfoKey,
          this.SelectedMyProfileInfoID
        );
      } catch (error) {
        console.error(error);
      }
    });
  },

  openMyProfileInfoSettings(event) {
    event.stopPropagation();

    window.open(`${AppAccountURL}#myprofileinfo`, '_blank');
  },

  insertVariablesInputWrapper() {
    let variableWrapper = document.querySelector('#' + variableWrapperID);

    if (variableWrapper) {
      variableWrapper.innerHTML = '';
      variableWrapper.classList.add('AIPRM__hidden');
    } else {
      const langWrapper = document.querySelector('#language-select-wrapper');

      if (!langWrapper) {
        console.error(
          'insertVariablesInputWrapper: No language select wrapper found'
        );
        return;
      }

      variableWrapper = document.createElement('div');
      variableWrapper.id = variableWrapperID;

      variableWrapper.className =
        'AIPRM__gap-3 lg:AIPRM__max-w-3xl md:last:AIPRM__mb-6 AIPRM__mx-2 AIPRM__pt-2 AIPRM__stretch AIPRM__justify-between AIPRM__text-sm AIPRM__pb-2 AIPRM__mb-2 AIPRM__border-b AIPRM__hidden';
      langWrapper.after(variableWrapper);
    }
  },

  // Change the TargetLanguage on selection change
  changeTargetLanguage(event) {
    this.TargetLanguage = event.target.value;

    // persist the last selected language in local storage
    localStorage.setItem(lastTargetLanguageKey, this.TargetLanguage);
  },

  // Change the Tone on selection change
  changeTone(event) {
    // Show upgrade modal if the user is not allowed to use more custom tones
    if (event.target.value === 'UPGRADE') {
      this.Tone = null;

      this.Client.UserQuota.upgradeCustomTone();

      return;
    }

    this.Tone = parseInt(event.target.value);
  },

  // Change the WritingStyle on selection change
  changeWritingStyle(event) {
    // Show upgrade modal if the user is not allowed to use more custom tones
    if (event.target.value === 'UPGRADE') {
      this.WritingStyle = null;

      this.Client.UserQuota.upgradeCustomTone();

      return;
    }

    this.WritingStyle = parseInt(event.target.value);
  },

  // Change the ContinueAction on selection change and submit the continue action prompt
  changeContinueAction(event) {
    // Show upgrade modal if the user is not allowed to use Power Continue
    if (event.target.value === 'UPGRADE') {
      this.Client.UserQuota.upgradePowerContinue();

      return;
    }

    const continueActionID = parseInt(event.target.value);

    // Get prompt for the selected continue action
    const continueAction = this.ContinueActions.find(
      (action) => action.ID === continueActionID
    );

    // If the continue action is not found, skip
    if (!continueAction) {
      return;
    }

    // Track usage of continue action
    this.Client.usePrompt(`${continueAction.ID}`, UsageTypeNo.SEND);

    // Submit the continue action prompt
    this.submitContinueActionPrompt(continueAction.Prompt);
  },

  // Ask ChatGPT to continue writing
  continueWriting() {
    this.submitContinueActionPrompt('Continue writing please');
  },

  // Submit the continue action prompt to ChatGPT
  submitContinueActionPrompt(prompt = '') {
    const selectorConfig = this.Config.getSelectorConfig();

    const textarea = document.querySelector(selectorConfig.PromptTextarea);

    // If the textarea is not empty and it's not "Continue writing please" - ask for confirmation
    if (
      textarea.value.trim() &&
      textarea.value.trim() !== 'Continue writing please' &&
      !confirm(
        'Are you sure you want to continue? The current prompt text will be lost.'
      )
    ) {
      return;
    }

    // Add the continue action prompt to the textarea
    textarea.value = prompt;
    textarea.focus();

    // Dispatch the input event to trigger the event listeners and enable the "Submit" button
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // select last button element for parent element of textarea
    let button = document.querySelector(selectorConfig.PromptSubmitButton);

    // If the button is not found, skip
    if (
      !button ||
      !button.tagName ||
      button.tagName.toLowerCase() !== 'button'
    ) {
      console.error('submitContinueActionPrompt: No button found');
      return;
    }

    // Enable button if it's disabled
    if (button.disabled) {
      button.disabled = false;
    }

    // Click the "Submit" button with a delay of 500ms
    setTimeout(() => {
      button.click();
    }, 500);
  },

  hideContinueActionsButton() {
    const button = document.querySelector('#continueActionsGroup');

    if (!button) {
      return;
    }

    button.classList.add('AIPRM__invisible');
  },

  showContinueActionsButton() {
    const button = document.querySelector('#continueActionsGroup');

    if (!button) {
      return;
    }

    button.classList.remove('AIPRM__invisible');
  },

  // Decrement the current page of the prompt templates section and re-render
  async prevPromptTemplatesPage() {
    this.PromptTemplateSection.currentPage--;
    this.PromptTemplateSection.currentPage = Math.max(
      0,
      this.PromptTemplateSection.currentPage
    );

    // Update the section
    await this.insertPromptTemplatesSection();
  },

  // nextPromptTemplatesPage increments the current page and re-renders the templates
  async nextPromptTemplatesPage() {
    let templates = await this.getCurrentPromptTemplates();

    if (!templates || !Array.isArray(templates)) return;

    // Filter templates based on selected activity and search query
    templates = await this.filterPromptTemplates(templates);

    // If there are no templates, skip
    if (templates.length === 0) return;

    this.PromptTemplateSection.currentPage++;

    this.PromptTemplateSection.currentPage = Math.min(
      Math.floor((templates.length - 1) / this.PromptTemplateSection.pageSize),
      this.PromptTemplateSection.currentPage
    );

    // Update the section
    await this.insertPromptTemplatesSection();
  },

  // Export the current chat log to a file
  exportCurrentChat() {
    // unknown prompt ID - use hardcoded prompt ID = UsageTypeNo.EXPORT
    this.Client.usePrompt(`${UsageTypeNo.EXPORT}`, UsageTypeNo.EXPORT);

    const selectorConfig = this.Config.getSelectorConfig();

    const blocks = [
      ...document.querySelector(selectorConfig.ChatLogContainer).children,
    ];

    let markdown = blocks.map((block) => {
      let wrapper = block.querySelector(
        selectorConfig.ConversationResponseWrapper
      );

      if (!wrapper) {
        return '';
      }

      // wrapper doesn't match conversation response selector - it's user's message
      if (!wrapper.querySelector(selectorConfig.ConversationResponse)) {
        return '**User:**\n' + wrapper.innerText;
      }

      // pass this point is assistant's

      wrapper = wrapper.firstChild;

      return (
        '**ChatGPT:**\n' +
        [...wrapper.children]
          .map((node) => {
            let language;

            switch (node.nodeName) {
              case 'PRE':
                language =
                  node
                    .getElementsByTagName('code')[0]
                    ?.classList[2]?.split('-')[1] || '';

                return `\`\`\`${language}\n${node.innerText
                  .replace(/^.*\n?Copy code/g, '')
                  .trim()}\n\`\`\``;
              default:
                return `${node.innerHTML}`;
            }
          })
          .join('\n')
      );
    });

    markdown = markdown.filter((b) => b);

    if (!markdown) return false;

    let header = '';

    try {
      header =
        ExportHeaderPrefix +
        window.__NEXT_DATA__.props.pageProps.user.name +
        ' on ' +
        new Date().toLocaleString() +
        '\n```\n\n---';
    } catch {
      console.error(
        'Failed to get user name from window.__NEXT_DATA__.props.pageProps.user.name. Using default header instead.'
      );
    }

    const blob = new Blob([header + '\n\n\n' + markdown.join('\n\n---\n\n')], {
      type: 'text/plain',
    });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    //a.download = 'chatgpt-thread_' + (new Date().toLocaleString('en-US', { hour12: false }).replace(/[\s/:]/g, '-').replace(',', '')) + '.md'
    a.download = ExportFilePrefix + new Date().toISOString() + '.md';
    document.body.appendChild(a);
    a.click();
  },

  /** @param {string} ForkedFromPromptID */
  updateForkedFromPromptLink(ForkedFromPromptID) {
    const forkedFromPromptLink = document.getElementById(
      'savePromptForm-forked-from'
    );

    // Update the "Forked from Prompt Template" link
    forkedFromPromptLink.href =
      'https://app.aiprm.com/prompts/' + ForkedFromPromptID;

    forkedFromPromptLink.innerHTML =
      'Forked from Prompt Template ' + ForkedFromPromptID;

    // Show the "Forked from Prompt Template" link
    forkedFromPromptLink.style = 'display: block;';
  },

  /** @param {HTMLFormElement} form */
  hidePublicPromptFormElements(form) {
    // Disable "Public" option for Prompt type
    document.getElementById('PromptTypeNo-public').disabled = true;

    // Hide the "Share as public" disclaimer
    document.getElementById('savePromptForm-public-disclaimer').style =
      'display: none;';
  },

  // Edit the prompt template
  async editPromptTemplate(idx) {
    const prompt = (await this.getCurrentPromptTemplates())[idx];
    if (!prompt.Prompt) {
      try {
        const promptFetch = await this.Client.getPrompt(prompt.ID, true);
        prompt.Prompt = promptFetch.Prompt;
      } catch (error) {
        this.showNotification(
          NotificationSeverity.ERROR,
          `Could not load the prompt template. ${
            error instanceof Reaction ? error.message : ''
          }`
        );
        return;
      }
    }

    // Only allow editing of own prompt templates
    if (
      this.PromptTemplatesType !== PromptTemplatesType.OWN &&
      !prompt.OwnPrompt &&
      !this.isAdminMode()
    ) {
      return;
    }

    await this.showSavePromptModal(new CustomEvent(editPromptTemplateEvent));

    // Pre-fill the prompt template modal with the prompt template
    const form = document.getElementById('savePromptForm');

    const promptText = prompt.Prompt.replace(headerRegexPattern, '');
    form.elements['Prompt'].value = promptText;
    form.elements['PromptTypeNo'].value = prompt.PromptTypeNo;
    form.elements['Teaser'].value = prompt.Teaser;
    form.elements['PromptHint'].value = prompt.PromptHint;
    form.elements['Title'].value = prompt.Title;
    form.elements['Community'].value = prompt.Community;
    form.elements['ID'].value = prompt.ID;
    form.elements['AuthorName'].value = prompt.AuthorName;
    form.elements['AuthorURL'].value = prompt.AuthorURL;
    form.elements['Views'].value = prompt.Views;
    form.elements['Usages'].value = prompt.Usages;
    form.elements['Votes'].value = prompt.Votes;

    this.prepareModelsMultiselect(prompt, form);

    // Show the "Forked from Prompt Template" link if applicable
    if (prompt.ForkedFromPromptID) {
      form.elements['ForkedFromPromptID'].value = prompt.ForkedFromPromptID;

      this.updateForkedFromPromptLink(prompt.ForkedFromPromptID);

      if (!this.isAdminMode()) {
        // Forked prompts for non-admins are always private
        this.hidePublicPromptFormElements(form);
      }
    }

    // Trigger onchange event on Topics to update available Activities
    form.elements['Community'].dispatchEvent(new Event('change'));

    // Set the selected Activity (category)
    form.elements['Category'].value = prompt.Category;

    const cloneButton = document.getElementById('AIPRM__cloneButton');
    cloneButton.classList.remove('AIPRM__hidden');
    cloneButton.onclick = () => {
      this.hideSavePromptModal();
      this.clonePrompt(idx);
    };
  },

  prepareModelsMultiselect(prompt, form) {
    const optionsModelS = Array.from(form.elements['ModelS'].options);
    optionsModelS?.forEach(function (o) {
      if (prompt.ModelS?.find((c) => c == o.value)) {
        o.selected = true;
      } else if (
        o.attributes['AIPRMModelStatusNo']?.value != ModelStatusNo.ACTIVE
      ) {
        o.remove();
      }
    });

    // initialize multi-select
    MultiselectDropdown(modelMultiselectOptions);
  },

  // Delete a prompt template
  async deletePromptTemplate(idx) {
    const prompt = (await this.getCurrentPromptTemplates())[idx];

    // Only allow deleting of own prompt templates
    if (
      this.PromptTemplatesType !== PromptTemplatesType.OWN &&
      !prompt.OwnPrompt &&
      !this.isAdminMode()
    ) {
      return;
    }

    // Ask for confirmation
    if (
      !confirm(
        `Are you sure you want to delete prompt template "${prompt.Title}"?`
      )
    ) {
      return;
    }

    try {
      await this.Client.deletePrompt(prompt.ID);

      // remove template using ID
      this.OwnPrompts = this.OwnPrompts.filter(
        (ownPrompt) => ownPrompt.ID !== prompt.ID
      );

      // remove template using ID from the public prompt templates if it's public
      if (prompt.PromptTypeNo === PromptTypeNo.PUBLIC) {
        this.PromptTemplates = this.PromptTemplates.filter(
          (promptTemplate) => promptTemplate.ID !== prompt.ID
        );
      }

      // remove template using ID from lists
      this.Lists.removeItemByPromptIDFromListsByType(prompt.ID);
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Something went wrong. Please try again.'
      );
      return;
    }

    // update the section
    await this.insertPromptTemplatesSection();
  },

  // Vote for a prompt template with a thumbs up
  async voteThumbsUp(idx) {
    try {
      await this.Client.voteForPrompt(
        (
          await this.getCurrentPromptTemplates()
        )[idx].ID,
        1
      );
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Something went wrong. Please try again.'
      );
      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      'Thanks for your vote!'
    );
  },

  // Vote for a prompt template with a thumbs down
  async voteThumbsDown(idx) {
    try {
      await this.Client.voteForPrompt(
        (
          await this.getCurrentPromptTemplates()
        )[idx].ID,
        -1
      );
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Something went wrong. Please try again.'
      );
      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      'Thanks for your vote!'
    );
  },

  // Report the prompt template as inappropriate
  async reportPrompt(e) {
    // prevent the form from submitting
    e.preventDefault();

    const formData = new FormData(e.target);

    try {
      await this.Client.reportPrompt(
        formData.get('PromptID'),
        +formData.get('FeedbackTypeNo'),
        formData.get('FeedbackText'),
        formData.get('FeedbackContact')
      );
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Something went wrong. Please try again.'
      );
      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      'Thanks for your feedback! We will review this prompt.'
    );

    this.hideModal('reportPromptModal');
  },

  // Copy link to prompt template to clipboard
  async copyPromptDeepLink(idx) {
    const prompt = (await this.getCurrentPromptTemplates())[idx];

    if (!prompt) {
      return;
    }

    const promptLink =
      prompt.PromptTypeNo === PromptTypeNo.PUBLIC
        ? `https://app.aiprm.com/prompts/${prompt.ID}`
        : `https://chat.openai.com/chat?${queryParamPromptID}=${prompt.ID}`;

    navigator.clipboard.writeText(promptLink).then(
      // successfully copied
      () => {
        // Warning about prompt not shared as public
        if (prompt.PromptTypeNo !== PromptTypeNo.PUBLIC) {
          this.showNotification(
            NotificationSeverity.WARNING,
            `The link to the prompt template was copied to your clipboard.<br>This prompt is not shared as public. Only you ${
              prompt.PromptTypeNo === PromptTypeNo.TEAM ? 'and your team' : ''
            } can access it.`
          );

          return;
        }

        // Success - copied & public
        this.showNotification(
          NotificationSeverity.SUCCESS,
          'The link to the prompt template was copied to your clipboard.'
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
  },

  // This function selects a prompt template using the index
  async selectPromptTemplateByIndex(idx) {
    const templates = await this.getCurrentPromptTemplates();

    // If there are no templates, skip
    if (!templates || !Array.isArray(templates)) return;

    await this.selectPromptTemplate(templates[idx]);

    // Hide the "Continue Writing" button (prompt selected/new chat)
    this.hideContinueActionsButton();
  },

  /**
   * Validates prompt variables
   *
   * @param {string} template - Prompt template
   * @returns {ValidatePromptVariablesResult} - Validation result
   */
  validatePromptVariables(template) {
    const errors = [];

    var matches;

    // collect all prompt variable placeholders
    var promptVariablePlaceholders = [];
    while ((matches = ValidateVariablePlaceholder.exec(template.Prompt))) {
      let promptVariableID = matches[1];

      let unique = true;
      promptVariablePlaceholders.forEach((v) => {
        if (v === promptVariableID) {
          unique = false;
        }
      });

      if (unique) {
        promptVariablePlaceholders.push(promptVariableID);
      }
    }

    // collect all prompt variable definitions
    var promptVariableDefinitions = [];
    while ((matches = ValidateVariableDefinition.exec(template.Prompt))) {
      let promptVariableID = matches[1];

      var unique = true;
      promptVariableDefinitions.forEach((v) => {
        if (v.ID === promptVariableID) {
          unique = false;
        }
      });

      if (unique) {
        let defaultValue = '';
        if (matches.length >= 4 && matches[3]) {
          defaultValue = matches[3].substring(1);
        }

        let enumS = [];
        if (matches.length >= 5 && matches[4]) {
          let enumsString = matches[4].substring(1);

          if (enumsString.length > 0) {
            enumS = enumsString.split('|');
          }
        }

        promptVariableDefinitions.push({
          ID: promptVariableID,
          Label: matches[2],
          DefaultValue: defaultValue,
          EnumS: enumS,
        });
      } else {
        errors.push(
          `Duplicate variable definition for VARIABLE${promptVariableID}.`
        );
      }
    }

    // check if there are not over limit variables
    if (
      promptVariablePlaceholders.length > ValidateVariableMaxCount ||
      promptVariableDefinitions.length > ValidateVariableMaxCount
    ) {
      errors.push(
        `Too many variables. Only up to ${ValidateVariableMaxCount} variables can be used per prompt template.`
      );

      return { Errors: errors };
    }

    // check if all prompt variable placeholders have a definition
    promptVariablePlaceholders.forEach((placeholder) => {
      if (placeholder <= ValidateVariableMaxCount) {
        let found = false;
        promptVariableDefinitions.forEach((definition) => {
          if (definition.ID === placeholder) {
            found = true;
          }
        });

        if (!found) {
          errors.push(
            `Missing variable definition for VARIABLE${placeholder}.`
          );
        }
      } else {
        errors.push(
          `Invalid variable placeholder for VARIABLE${placeholder}. Only variables 1 to 6 can be used.`
        );
      }
    });

    // max allowed enum values for prompt variables
    const promptVarEnumMaxSize =
      this.Client.UserQuota.promptVariableEnumMaxSize();

    // check prompt variable enum values size
    for (var i = 0; i < promptVariableDefinitions.length; i++) {
      if (promptVariableDefinitions[i].EnumS.length > promptVarEnumMaxSize) {
        return { EnumMaxSizeError: true };
      }
    }

    // check if all prompt variable definitions have a placeholder
    promptVariableDefinitions.forEach((definition) => {
      if (definition.ID <= ValidateVariableMaxCount) {
        let found = false;
        promptVariablePlaceholders.forEach((placeholder) => {
          if (definition.ID === placeholder) {
            found = true;
          }
        });

        if (!found) {
          errors.push(
            `Unused variable definition for VARIABLE${definition.ID}.`
          );
        }
      } else {
        errors.push(
          `Invalid variable definition for VARIABLE${definition.ID}. Only variables 1 to 6 can be defined.`
        );
      }
    });

    return { Errors: errors };
  },

  extractVariableDefinitions(template) {
    if (template.PromptVariables) {
      return;
    }

    var promptVariables = [];
    var matches;
    while ((matches = VariableDefinition.exec(template.Prompt))) {
      let promptVariableID = matches[1];

      var unique = true;
      promptVariables.forEach((promptVariable) => {
        if (promptVariable.ID === promptVariableID) {
          unique = false;
        }
      });

      if (unique) {
        let defaultValue = '';
        if (matches.length >= 4 && matches[3]) {
          defaultValue = matches[3].substring(1);
        }

        let enumS = [];
        if (matches.length >= 5 && matches[4]) {
          let enumsString = matches[4].substring(1);

          if (enumsString.length > 0) {
            enumS = enumsString.split('|');
          }
        }

        promptVariables.push({
          ID: promptVariableID,
          Label: matches[2],
          DefaultValue: defaultValue,
          EnumS: enumS,
        });
      }
    }

    if (promptVariables.length > 0) {
      // Reorder prompt variables by ID ascending
      promptVariables.sort((a, b) => a.ID - b.ID);

      template.PromptVariables = promptVariables;
    }
  },

  promptVariableEnumValueSelected(selectElem) {
    // Show upgrade modal if the user is not allowed to use more enum values
    if (selectElem.value === 'UPGRADE') {
      selectElem.selectedIndex = 0;
      this.Client.UserQuota.upgradePromptVariableEnumMaxSize();

      return;
    }
  },

  /**
   * Select a prompt template and show it in the prompt input field
   *
   * @param {Prompt} template
   */
  async selectPromptTemplate(template) {
    if (template && !template.Prompt) {
      try {
        const templateFetch = await this.Client.getPrompt(template.ID, true);
        template.Prompt = templateFetch.Prompt;
      } catch (error) {
        this.showNotification(
          NotificationSeverity.ERROR,
          `Could not load the prompt template. ${
            error instanceof Reaction ? error.message : ''
          }`
        );
        return;
      }
    }

    const textarea = document.querySelector(
      this.Config.getSelectorConfig().PromptTextarea
    );

    if (!textarea) {
      console.error('selectPromptTemplate: No textarea found');
      return;
    }

    const parent = textarea.parentElement;
    let wrapper = document.createElement('div');
    wrapper.id = 'prompt-wrapper';
    if (parent.querySelector('#prompt-wrapper')) {
      wrapper = parent.querySelector('#prompt-wrapper');
    } else {
      parent.prepend(wrapper);
    }

    const url = new URL(window.location.href);

    this.insertVariablesInputWrapper();

    const variableWrapper = document.querySelector('#' + variableWrapperID);

    if (template) {
      // if the prompt needs live crawling, check if the user can use it
      if (
        this.promptRequiresLiveCrawling(template.Prompt) &&
        !this.Client.UserQuota.canUseLiveCrawling()
      ) {
        return;
      }

      wrapper.innerHTML = /*html*/ `
        <span class="${css`tag`}" title="${sanitizeInput(template.Teaser)}">
          ${sanitizeInput(template.Title)}

          <a title="Deselect prompt / New chat"
            class="AIPRM__ml-3 AIPRM__align-middle AIPRM__inline-block AIPRM__rounded-md hover:AIPRM__bg-gray-100 hover:AIPRM__text-gray-700 dark:AIPRM__text-gray-400 dark:hover:AIPRM__bg-gray-700 dark:hover:AIPRM__text-gray-200 disabled:dark:hover:AIPRM__text-gray-400" 
            onclick="event.stopPropagation(); AIPRM.selectPromptTemplateByIndex(null)">
            ${svg('Cross')}
          </a>
        </span>

        ${
          template.AuthorName
            ? /*html*/ `
              <span class="AIPRM__text-xs">by 
                ${
                  template.AuthorURL
                    ? /*html*/ `<a href="${sanitizeInput(template.AuthorURL)}"
                      class="AIPRM__mx-1 AIPRM__underline" 
                      onclick="event.stopPropagation()"
                      rel="noopener noreferrer" target="_blank"
                      title="Created by">${sanitizeInput(
                        template.AuthorName
                      )}</a>`
                    : /*html*/ `<span class="AIPRM__mx-1" title="Created by ${sanitizeInput(
                        template.AuthorName
                      )}">${sanitizeInput(template.AuthorName)}</span>`
                }
              </span>
            `
            : ''
        }`;

      this.extractVariableDefinitions(template);

      if (template.PromptVariables && template.PromptVariables.length > 0) {
        variableWrapper.classList.remove('AIPRM__hidden');

        if (template.PromptVariables.length == 1) {
          variableWrapper.classList.remove(
            'AIPRM__grid',
            'AIPRM__grid-cols-1',
            'lg:AIPRM__grid-cols-2'
          );
        } else {
          variableWrapper.classList.add(
            'AIPRM__grid',
            'AIPRM__grid-cols-1',
            'lg:AIPRM__grid-cols-2'
          );
        }

        template.PromptVariables.forEach((promptVariable) => {
          const variableElement = document.createElement('div');

          let variableHTML = /*html*/ `
            <label class="AIPRM__block AIPRM__text-sm AIPRM__font-medium AIPRM__truncate" title="${sanitizeInput(
              promptVariable.Label
            )}">${sanitizeInput(promptVariable.Label)}</label>
          `;

          if (promptVariable.EnumS.length > 0) {
            variableHTML += /*html*/ `
              <select id="${variableIDPrefix}${promptVariable.ID}" 
                name="${variableIDPrefix}${promptVariable.ID}"
                title="${sanitizeInput(promptVariable.Label)}"
                onchange="AIPRM.promptVariableEnumValueSelected(this)"
                class="AIPRM__w-full AIPRM__border-0 AIPRM__rounded AIPRM__p-2 AIPRM__mt-1 AIPRM__bg-gray-100 dark:AIPRM__bg-gray-600 dark:AIPRM__border-gray-600 dark:hover:AIPRM__bg-gray-900 dark:AIPRM__placeholder-gray-400 dark:AIPRM__text-white hover:AIPRM__bg-gray-200" required>
                  ${promptVariable.EnumS.slice(
                    0,
                    this.Client.UserQuota.promptVariableEnumMaxSize()
                  )
                    .map(
                      (e) => /*html*/ `
                      <option value="${sanitizeInput(e)}" ${
                        promptVariable.DefaultValue === e ? 'selected' : ''
                      }>${sanitizeInput(e)}</option>`
                    )
                    .join('')}

                  ${
                    promptVariable.EnumS.length >
                    this.Client.UserQuota.promptVariableEnumMaxSize()
                      ? '<option value disabled>_________</option><option value="UPGRADE">Upgrade for all prompt variable values</option>'
                      : ''
                  }
              }
              </select>
           `;
          } else {
            variableHTML += /*html*/ `
              <textarea id="${variableIDPrefix}${promptVariable.ID}" 
              name="${variableIDPrefix}${promptVariable.ID}"
              rows="1"
              title="${sanitizeInput(promptVariable.Label)}"
              placeholder="${sanitizeInput(promptVariable.Label)}"
              class="AIPRM__w-full AIPRM__border-0 AIPRM__rounded AIPRM__p-2 AIPRM__mt-1 AIPRM__bg-gray-100 dark:AIPRM__bg-gray-600 dark:AIPRM__border-gray-600 dark:hover:AIPRM__bg-gray-900 dark:AIPRM__placeholder-gray-400 dark:AIPRM__text-white hover:AIPRM__bg-gray-200">${sanitizeInput(
                promptVariable.DefaultValue
              )}</textarea>
            `;
          }

          variableElement.innerHTML = variableHTML;
          variableWrapper.append(variableElement);
        });
      }

      textarea.placeholder = template.PromptHint;
      this.SelectedPromptTemplate = template;
      textarea.focus();

      this.Client.usePrompt(template.ID, UsageTypeNo.CLICK);

      // Update query param AIPRM_PromptID to the selected prompt ID
      if (url.searchParams.get(queryParamPromptID) === template.ID) {
        return;
      }

      url.searchParams.set(queryParamPromptID, template.ID);
    } else {
      wrapper.innerHTML = '';
      textarea.placeholder = '';
      this.SelectedPromptTemplate = null;

      // Remove AIPRM_VARIABLE* and AIPRM_PromptID query params
      const removeSearchParams = [];

      for (const key of url.searchParams.keys()) {
        if (key.startsWith(queryParamVariable) || key === queryParamPromptID) {
          removeSearchParams.push(key);
        }
      }

      // No need to update the history if no query params to remove
      if (!removeSearchParams.length) {
        return;
      }

      // Remove query params
      removeSearchParams.forEach((key) => url.searchParams.delete(key));
    }

    // Push new URL to browser history
    window.history.pushState({}, '', url);
  },

  CSVToArray(strData, strDelimiter) {
    strDelimiter = strDelimiter || ',';
    var pattern = new RegExp(
      '(\\' +
        strDelimiter +
        '|\\r?\\n|\\r|^)' +
        '(?:"([^"]*(?:""[^"]*)*)"|' +
        '([^"\\' +
        strDelimiter +
        '\\r\\n]*))',
      'gi'
    );
    var data = [[]];
    var matches;

    // No need to continue if no strData provided
    if (!strData) {
      return data;
    }

    while ((matches = pattern.exec(strData))) {
      var delimiter = matches[1];
      if (delimiter.length && delimiter !== strDelimiter) {
        data.push([]);
      }
      var value = matches[2]
        ? matches[2].replace(new RegExp('""', 'g'), '"')
        : matches[3];
      data[data.length - 1].push(value);
    }
    return data;
  },

  // get the topic label from the topic ID
  getTopicLabel(TopicID) {
    const topic = this.Topics.find((topic) => topic.ID === TopicID);

    if (!topic) {
      return '';
    }

    return topic.Label;
  },

  // get the activity label from the activity ID
  getActivityLabel(ActivityID) {
    const activity = this.Activities.find(
      (activity) => activity.ID === ActivityID
    );

    if (!activity) {
      return '';
    }

    return activity.Label;
  },

  // current user is admin
  isAdmin() {
    return this.Client.User.UserLevelNo === UserLevelNo.SUPER_ADMIN;
  },

  // current user is admin and has enabled admin mode
  isAdminMode() {
    return this.isAdmin() && this.AdminMode;
  },

  // toggle admin mode and re-render prompt templates
  async toggleAdminMode() {
    if (!this.isAdmin()) {
      return;
    }

    this.AdminMode = !this.AdminMode;

    await this.insertPromptTemplatesSection();
  },

  // current user can create public or private prompt template
  canCreatePromptTemplate() {
    return (
      this.canCreatePublicPromptTemplate() ||
      this.canCreateTeamPromptTemplate() ||
      this.canCreatePrivatePromptTemplate()
    );
  },

  // current user can create private prompt template
  canCreatePrivatePromptTemplate() {
    return (
      this.isAdmin() ||
      this.Client.UserQuota.canCreatePrivatePromptTemplate(this.OwnPrompts)
    );
  },

  // current user can create private prompt template
  canCreateTeamPromptTemplate() {
    return (
      this.isAdmin() ||
      this.Client.UserQuota.canCreateTeamPromptTemplate(this.OwnPrompts)
    );
  },

  // current user can create public prompt template
  canCreatePublicPromptTemplate() {
    return (
      this.isAdmin() ||
      this.Client.UserQuota.canCreatePublicPromptTemplate(this.OwnPrompts)
    );
  },

  /**
   * Show modal to view prompt template
   */
  async showViewPromptModal(idx) {
    const prompt = (await this.getCurrentPromptTemplates())[idx];

    let viewPromptModal = document.getElementById('viewPromptModal');

    // if modal does not exist, create it, add event listener on submit and append it to body
    if (!viewPromptModal) {
      viewPromptModal = document.createElement('div');
      viewPromptModal.id = 'viewPromptModal';
      document.body.appendChild(viewPromptModal);
    }

    viewPromptModal.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__text-center AIPRM__transition-opacity AIPRM__z-50">
        <div class="AIPRM__absolute AIPRM__bg-gray-900 AIPRM__inset-0 AIPRM__opacity-90">
        </div>

        <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__overflow-y-auto">
          <div class="AIPRM__flex AIPRM__items-center AIPRM__justify-center AIPRM__min-h-full">
            <form id="viewPromptForm">
              <div
              class="AIPRM__align-center AIPRM__bg-white dark:AIPRM__bg-gray-800 dark:AIPRM__text-gray-200 AIPRM__inline-block AIPRM__overflow-hidden sm:AIPRM__rounded-lg AIPRM__shadow-xl sm:AIPRM__align-middle sm:AIPRM__max-w-lg sm:AIPRM__my-8 sm:AIPRM__w-full AIPRM__text-left AIPRM__transform AIPRM__transition-all"
              role="dialog" aria-modal="true" aria-labelledby="modal-headline">
          
                <div class="AIPRM__bg-white dark:AIPRM__bg-gray-800 AIPRM__px-4 AIPRM__pt-5 AIPRM__pb-4 sm:AIPRM__p-6 sm:AIPRM__pb-4 AIPRM__overflow-y-auto">
                  <label>Prompt Template</label>
                  <textarea disabled name="Prompt" class="AIPRM__w-full AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__p-2 AIPRM__mt-2 AIPRM__mb-3" style="height: 120px;" required
                            placeholder="Prompt text including placeholders [TARGETLANGUAGE] or [PROMPT] replaced automagically by AIPRM"
                            title="Prompt text including placeholders [TARGETLANGUAGE] or [PROMPT] replaced automagically by AIPRM"></textarea>
            
                  <label>Teaser</label>
                  <textarea disabled name="Teaser" required
                    title="Short teaser for this prompt template, e.g. 'Create a keyword strategy and SEO content plan from 1 [KEYWORD]'"
                    class="AIPRM__w-full AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__p-2 AIPRM__mt-2 AIPRM__mb-3" style="height: 71px;"
                    placeholder="Create a keyword strategy and SEO content plan from 1 [KEYWORD]"></textarea>
                    
                  <label>Prompt Hint</label>
                  <input disabled name="PromptHint" required type="text"
                    title="Prompt hint for this prompt template, e.g. '[KEYWORD]' or '[your list of keywords, maximum ca. 8000]"
                    class="AIPRM__w-full AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__p-2 AIPRM__mt-2 AIPRM__mb-3" placeholder="[KEYWORD] or [your list of keywords, maximum ca. 8000]" />

                  <label>Title</label>
                  <input disabled name="Title" type="text" 
                    title="Short title for this prompt template, e.g. 'Keyword Strategy'" required placeholder="Keyword Strategy" class="AIPRM__w-full AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__mb-3 AIPRM__mt-2 AIPRM__p-2" />
            
                  <div class="AIPRM__flex">
                    <div class="AIPRM__mr-4 AIPRM__w-full">
                      <label>Topic</label>
                      <select disabled name="Community" class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full" required>
                        ${this.Topics.map(
                          (topic) => /*html*/ `
                              <option value="${sanitizeInput(topic.ID)}" ${
                            topic.ID === prompt.Community ? 'selected' : ''
                          }>${sanitizeInput(topic.Label)}</option>`
                        ).join('')}
                      </select>
                    </div>

                    <div class="AIPRM__w-full">
                      <label>Activity</label>
                      <select disabled name="Category" class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full" required>
                        ${this.getActivities(prompt.Community)
                          .map(
                            (activity) => /*html*/ `
                              <option value="${sanitizeInput(
                                activity.ID
                              )}">${sanitizeInput(activity.Label)}</option>`
                          )
                          .join('')}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label>Made for</label>
                    <div class="AIPRM__w-full AIPRM__border-gray-500 AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__p-2 AIPRM__mt-2 AIPRM__mb-3 AIPRM__border">
                      ${
                        prompt.ModelS?.length > 0
                          ? prompt.ModelS?.map((modelID) => {
                              const model = this.Models?.find(
                                (m) => m.ID === modelID
                              );
                              const modelLabel = model?.LabelAuthor;

                              return modelLabel
                                ? /*html*/ `<span class="AIPRM__whitespace-nowrap ${
                                    model?.StatusNo !== ModelStatusNo.ACTIVE
                                      ? 'AIPRM__line-through'
                                      : ''
                                  }" title="This prompt is optimized for ${sanitizeInput(
                                    modelLabel
                                  )}${
                                    model?.StatusNo !== ModelStatusNo.ACTIVE
                                      ? ' (deprecated)'
                                      : ''
                                  }">${sanitizeInput(modelLabel)}</span>`
                                : '';
                            })
                              .filter((m) => m !== '')
                              .join(', ')
                          : /*html*/ `<span title="This prompt is not optimized for specific model">Not specific</span>`
                      }
                    </div>
                  </div>

                  <div class="AIPRM__block AIPRM__mt-4">
                    <div class="AIPRM__flex AIPRM__justify-between AIPRM__mt-4">
                      <div class="AIPRM__mr-4 AIPRM__w-full"><label>Author Name</label>
                        <input disabled name="AuthorName" type="text" title="Author Name visible for all users"
                              placeholder="Author Name" class="AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__mb-3 AIPRM__mt-2 AIPRM__p-2 AIPRM__w-full" />
                      </div>

                      <div class="AIPRM__w-full"><label>Author URL</label>
                        <input disabled name="AuthorURL" type="url" title="Author URL visible for all users"
                              placeholder="https://www.example.com/" class="AIPRM__bg-gray-100 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 AIPRM__rounded AIPRM__mb-3 AIPRM__mt-2 AIPRM__p-2 AIPRM__w-full" />
                      </div>
                    </div>                
                  </div>
                </div>
            
                <div class="AIPRM__bg-gray-200 dark:AIPRM__bg-gray-700 AIPRM__px-4 AIPRM__py-3 AIPRM__text-right">
                  <button type="button" class="AIPRM__bg-gray-600 hover:AIPRM__bg-gray-800 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white"
                          onclick="AIPRM.hideViewPromptModal()"> Close
                  </button>
                  <button type="button" class="AIPRM__bg-green-600 hover:AIPRM__bg-green-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white"  
                          onclick="AIPRM.hideViewPromptModal(); AIPRM.forkToPrivatePrompt(${idx})">
                    Fork as Private Prompt
                  </button>
                </div>
            
              </div>
            </form>
          </div>
        </div>
        
      </div>
    `;

    viewPromptModal.style = 'display: block;';

    // add event listener to close the modal on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideViewPromptModal();
      }
    });
  },

  hideViewPromptModal() {
    this.hideModal('viewPromptModal');
  },

  async viewPromptTemplateSource(idx) {
    if (!this.Client.UserQuota.canUseViewPromptTemplateSource()) {
      return;
    }

    const prompt = (await this.getCurrentPromptTemplates())[idx];
    if (!prompt.Prompt) {
      try {
        const promptFetch = await this.Client.getPrompt(prompt.ID, true);
        prompt.Prompt = promptFetch.Prompt;
      } catch (error) {
        this.showNotification(
          NotificationSeverity.ERROR,
          `Could not load the prompt template. ${
            error instanceof Reaction ? error.message : ''
          }`
        );
        return;
      }
    }

    this.Client.usePrompt(prompt.ID, UsageTypeNo.VIEW_SOURCE);

    await this.showViewPromptModal(idx);

    // Pre-fill the prompt template modal with the prompt template
    const form = document.getElementById('viewPromptForm');

    const promptText = prompt.Prompt.replace(headerRegexPattern, '');
    form.elements['Prompt'].value = promptText;
    form.elements['Teaser'].value = prompt.Teaser;
    form.elements['PromptHint'].value = prompt.PromptHint;
    form.elements['Title'].value = prompt.Title;
    form.elements['Community'].value = prompt.Community;
    form.elements['Category'].value = prompt.Category;
    form.elements['AuthorName'].value = prompt.AuthorName;
    form.elements['AuthorURL'].value = prompt.AuthorURL;
  },

  async forkToPrivatePrompt(idx) {
    const promptOriginal = (await this.getCurrentPromptTemplates())[idx];

    this.Client.usePrompt(promptOriginal.ID, UsageTypeNo.FORK);

    await this.showSavePromptModal(new CustomEvent(forkPromptTemplateEvent));

    // Pre-fill the prompt template modal with the prompt template
    const form = document.getElementById('savePromptForm');

    form.elements['ForkedFromPromptID'].value = promptOriginal.ID;

    const promptText = promptOriginal.Prompt.replace(headerRegexPattern, '');
    form.elements['Prompt'].value = promptText;
    form.elements['Teaser'].value = promptOriginal.Teaser;
    form.elements['PromptHint'].value = promptOriginal.PromptHint;
    form.elements['Title'].value = promptOriginal.Title;
    form.elements['Community'].value = promptOriginal.Community;

    this.prepareModelsMultiselect(promptOriginal, form);

    // Update the "Forked from Prompt Template" link
    this.updateForkedFromPromptLink(promptOriginal.ID);

    form.elements['PromptTypeNo'].value = promptOriginal.PromptTypeNo;

    // Forked prompts for non-admins are always private
    if (!this.isAdminMode()) {
      if (promptOriginal.PromptTypeNo === PromptTypeNo.PUBLIC) {
        form.elements['PromptTypeNo'].value = PromptTypeNo.PRIVATE;
      }

      this.hidePublicPromptFormElements(form);
    }

    // Trigger onchange event on Topics to update available Activities
    form.elements['Community'].dispatchEvent(new Event('change'));

    // Set the selected Activity (category)
    form.elements['Category'].value = promptOriginal.Category;
  },

  async clonePrompt(idx) {
    const promptOriginal = (await this.getCurrentPromptTemplates())[idx];

    await this.showSavePromptModal(new CustomEvent(clonePromptTemplateEvent));

    // Pre-fill the prompt template modal with the cloned prompt template
    const form = document.getElementById('savePromptForm');

    // Do not set prompt.ID from original prompt template to create a new prompt
    const promptText = promptOriginal.Prompt.replace(headerRegexPattern, '');
    form.elements['Prompt'].value = promptText;
    form.elements['PromptTypeNo'].value = promptOriginal.PromptTypeNo;
    form.elements['Teaser'].value = promptOriginal.Teaser;
    form.elements['PromptHint'].value = promptOriginal.PromptHint;
    form.elements['Title'].value = promptOriginal.Title;
    form.elements['Community'].value = promptOriginal.Community;
    form.elements['AuthorName'].value = promptOriginal.AuthorName;
    form.elements['AuthorURL'].value = promptOriginal.AuthorURL;

    this.prepareModelsMultiselect(promptOriginal, form);

    // Cloning forked prompt template results in a forked prompt too
    if (promptOriginal.ForkedFromPromptID) {
      form.elements['ForkedFromPromptID'].value =
        promptOriginal.ForkedFromPromptID;

      this.updateForkedFromPromptLink(promptOriginal.ForkedFromPromptID);

      if (!this.isAdminMode()) {
        // Forked prompts for non-admins are always private
        this.hidePublicPromptFormElements(form);
      }
    }

    // Trigger onchange event on Topics to update available Activities
    form.elements['Community'].dispatchEvent(new Event('change'));

    // Set the selected Activity (category)
    form.elements['Category'].value = promptOriginal.Category;
  },

  // Add prompt template to "Hidden" prompts list
  async addToHiddenList(idx) {
    if (!this.Client.UserQuota.canUseHidden(this.Lists)) {
      return;
    }

    const prompt = (await this.getCurrentPromptTemplates())[idx];

    const hiddenList = this.Lists.getHidden();

    try {
      hiddenList
        ? // if hidden list already exists, add prompt to it
          await hiddenList.add(prompt)
        : // if hidden list does not exist, create it and add prompt to it
          await this.Lists.create(this.Client, ListTypeNo.HIDDEN, '', {
            PromptID: prompt.ID,
            Comment: '',
          });
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not hide prompt template. ${
          error instanceof Reaction ? error.message : ''
        }`
      );

      if (
        error instanceof Reaction &&
        error.ReactionNo === ReactionNo.RXN_AIPRM_QUOTA_EXCEEDED
      ) {
        hiddenList
          ? this.Client.UserQuota.listItemQuotaExceeded()
          : this.Client.UserQuota.listQuotaExceeded();
      }

      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      'Added to "Hidden" prompts list.'
    );

    await this.insertPromptTemplatesSection();
  },

  // Remove prompt template from "Hidden" prompts list
  async removeFromHiddenList(idx) {
    const prompt = (await this.getCurrentPromptTemplates())[idx];

    const list = this.Lists.getHidden();

    try {
      await list.remove(prompt);
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not unhide prompt template. ${
          error instanceof Reaction ? error.message : ''
        }`
      );
      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      'Removed from "Hidden" prompts list.'
    );

    await this.insertPromptTemplatesSection();
  },

  // Check if prompt template is hidden
  async isHidden(prompt) {
    const list = this.Lists.getHidden();

    if (!list) {
      return false;
    }

    return await list.has(prompt);
  },

  /**
   * Add prompt template to "Favorites" prompts list
   *
   * @param {string} idx - prompt template index
   * @returns {Promise<void>}
   */
  async addToFavoritesList(idx) {
    if (!this.Client.UserQuota.canUseFavorites(this.Lists)) {
      return;
    }

    const prompt = (await this.getCurrentPromptTemplates())[idx];

    const favoritesList = this.Lists.getFavorites();

    try {
      favoritesList
        ? // if favorites list already exists, add prompt to it
          await favoritesList.add(prompt)
        : // if favorites list does not exist, create it and add prompt to it
          await this.Lists.create(this.Client, ListTypeNo.FAVORITES, '', {
            PromptID: prompt.ID,
            Comment: '',
          });

      // Update context menu
      await this.setupFavoritePromptsContextMenu();
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not add to "Favorites" prompts list. ${
          error instanceof Reaction ? error.message : ''
        }`
      );

      if (
        error instanceof Reaction &&
        error.ReactionNo === ReactionNo.RXN_AIPRM_QUOTA_EXCEEDED
      ) {
        favoritesList
          ? this.Client.UserQuota.listItemQuotaExceeded()
          : this.Client.UserQuota.listQuotaExceeded();
      }

      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      'Added to "Favorites" prompts list.'
    );

    this.insertPromptTemplatesSection();
  },

  /**
   * Remove prompt template from "Favorites" prompts list
   *
   * @param {string} idx - prompt template index
   * @returns {Promise<void>}
   */
  async removeFromFavoritesList(idx) {
    const prompt = (await this.getCurrentPromptTemplates())[idx];

    const list = this.Lists.getFavorites();

    try {
      // remove prompt from favorites list via API and update the local list
      await list.remove(prompt);

      // Update context menu
      await this.setupFavoritePromptsContextMenu();
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not remove from "Favorites" prompts list. ${
          error instanceof Reaction ? error.message : ''
        }`
      );
      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      'Removed from "Favorites" prompts list.'
    );

    this.insertPromptTemplatesSection();
  },

  /**
   * Check if prompt is in "Favorites" prompts list
   *
   * @param {string} idx - prompt template index
   * @returns {Promise<boolean>}
   */
  async isFavorite(idx) {
    const list = this.Lists.getFavorites();

    if (!list) {
      return false;
    }

    const prompt = (await this.getCurrentPromptTemplates())[idx];

    return await list.has(prompt);
  },

  /**
   * Add prompt template to custom list
   *
   * @param {string} idx
   */
  async addToList(idx) {
    const prompt = (await this.getCurrentPromptTemplates())[idx];

    const lists = this.Lists.getCustomWithWriteAccess(
      this.Client.UserQuota,
      this.Client.UserTeamM
    );

    const AIPRMVerifiedList = this.Lists.getAIPRMVerified();

    // if AIPRM verified list exists and it's owned by the user, add it to the list
    if (AIPRMVerifiedList && AIPRMVerifiedList.OwnList) {
      lists.push(AIPRMVerifiedList);
    }

    // sort lists by Comment
    lists.sort((a, b) => a.Comment.localeCompare(b.Comment));

    // show list selection modal
    this.showListSelectionModal(lists, prompt);
  },

  /**
   * Remove prompt template from custom list
   *
   * @param {List['ID']} listID
   * @param {string} idx - prompt template index
   */
  async removeFromList(listID, idx) {
    const prompt = (await this.getCurrentPromptTemplates())[idx];

    const list = this.Lists.withID(listID);

    try {
      // remove prompt from list via API and update local list
      await list.remove(prompt);
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not remove from list. ${
          error instanceof Reaction ? error.message : ''
        }`
      );
      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      `Removed from "${sanitizeInput(list.Comment)}" prompts list.`
    );

    this.insertPromptTemplatesSection();
  },

  /**
   * Show list selection modal to select list to add prompt to or to create a new list
   *
   * @param {List[]} lists
   * @param {Prompt} prompt
   */
  showListSelectionModal(lists, prompt, onlyTeamLists = false) {
    let listSelectionModal = document.getElementById('listSelectionModal');

    // if modal does not exist, create it, add event listener on submit and append it to body
    if (!listSelectionModal) {
      listSelectionModal = document.createElement('div');
      listSelectionModal.id = 'listSelectionModal';

      if (onlyTeamLists) {
        listSelectionModal.addEventListener(
          'submit',
          this.handleListSelectionModalSubmit.bind(this, prompt)
        );
      } else {
        listSelectionModal.addEventListener(
          'submit',
          this.handleListSelectionModalSubmit.bind(this, undefined)
        );
      }

      document.body.appendChild(listSelectionModal);
    }

    listSelectionModal.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__text-center AIPRM__transition-opacity AIPRM__z-50">
        <div class="AIPRM__absolute AIPRM__bg-gray-900 AIPRM__inset-0 AIPRM__opacity-90">
        </div>

        <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__overflow-y-auto">
          <div class="AIPRM__flex AIPRM__items-center AIPRM__justify-center AIPRM__min-h-full">
            <form>
              <div
                class="AIPRM__align-center AIPRM__bg-white dark:AIPRM__bg-gray-800 dark:AIPRM__text-gray-200 AIPRM__inline-block AIPRM__overflow-hidden sm:AIPRM__rounded-lg AIPRM__shadow-xl sm:AIPRM__align-middle sm:AIPRM__max-w-lg sm:AIPRM__my-8 sm:AIPRM__w-full AIPRM__text-left AIPRM__transform AIPRM__transition-all"
                role="dialog" aria-modal="true" aria-labelledby="modal-headline">

                <div class="AIPRM__bg-white dark:AIPRM__bg-gray-800 AIPRM__px-4 AIPRM__pt-5 AIPRM__pb-4 sm:AIPRM__p-6 sm:AIPRM__pb-4 AIPRM__w-96">

                  <input type="hidden" name="promptID" value="${sanitizeInput(
                    prompt.ID
                  )}">          

                  <h3 class="${css`h3`} AIPRM__my-4">${
      onlyTeamLists ? 'Choose Team List to add to' : 'Choose a list'
    }</h3>

                  <label class="AIPRM__block">Lists</label>
                  <select name="listID" class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full">
                    ${lists
                      .map((list) => {
                        if (
                          list.ListTypeNo === ListTypeNo.AIPRM_VERIFIED ||
                          list.ListTypeNo === ListTypeNo.CUSTOM ||
                          list.HasWriteAccessForTeamMember(
                            this.Client.UserTeamM
                          )
                        ) {
                          const disabledFlag =
                            list.ListTypeNo == ListTypeNo.TEAM_CUSTOM &&
                            prompt.PromptTypeNo === PromptTypeNo.PRIVATE
                              ? 'disabled'
                              : '';

                          return `<option value="${sanitizeInput(
                            list.ID
                          )}" ${disabledFlag} ${
                            this.PromptTemplatesList === list.ID
                              ? 'selected'
                              : ''
                          }>${sanitizeInput(list.Comment)}${
                            list.ListTypeNo == ListTypeNo.TEAM_CUSTOM
                              ? ' (Team List)'
                              : ''
                          }</option>`;
                        }
                      })
                      .join('')}

                      <option disabled>_________</option>

                      ${
                        !lists.length
                          ? '<option value selected>-- No lists found, yet. Please create a new custom list first. --</option>'
                          : '<option value>-- Create a new list --</option>'
                      }
                  </select>
                  
                  <div id="createNewList" class="${
                    lists.length &&
                    (this.Lists.withType(ListTypeNo.CUSTOM) !== undefined ||
                      prompt.PromptTypeNo !== PromptTypeNo.PRIVATE)
                      ? 'AIPRM__hidden'
                      : ''
                  }">
                    <h3 class="${css`h3`} AIPRM__my-4 AIPRM__mt-6">Create a new list</h3>
                    
                    <label class="AIPRM__block">List Name</label>
                    <input type="text" name="listName" class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full" ${
                      !(
                        lists.length ||
                        (prompt.PromptTypeNo !== PromptTypeNo.PRIVATE &&
                          this.Lists.withType(ListTypeNo.CUSTOM) !== undefined)
                      )
                        ? 'required'
                        : ''
                    }>

                    ${
                      prompt.PromptTypeNo !== PromptTypeNo.PRIVATE &&
                      this.Client.UserQuota?.hasTeamsFeatureEnabled()
                        ? /*html*/ `
                        <label class="AIPRM__text-sm AIPRM__flex AIPRM__items-center" id="savePromptForm-public-checkbox">
                          <input id="createNewListShareWithTeam" name="createNewListShareWithTeam" 
                            type="checkbox" class="AIPRM__mr-2 dark:AIPRM__bg-gray-700" 
                            onchange="AIPRM.toggleCreateNewListSelectTeam();"
                            ${onlyTeamLists ? 'checked disabled' : ''}> 
                          Share with Team
                        </label>

                        <div id="createNewListSelectTeam" class="${
                          !onlyTeamLists ? 'AIPRM__hidden' : ''
                        }">
                          <select id="createNewListSelectTeam" name="createNewListSelectTeam" class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full">
                            ${
                              this.Client.OwnTeamS?.length > 0
                                ? this.Client.OwnTeamS.map(
                                    (team) =>
                                      /*html*/ `<option value="${sanitizeInput(
                                        team.TeamID
                                      )}">${sanitizeInput(
                                        team.TeamName
                                      )}</option>`
                                  ).join('')
                                : /*html*/ `<option value="NEW">My First Team</option>`
                            }
                          </select>

                          ${
                            this.Client.OwnTeamS?.length > 0
                              ? /*html*/ `<a href="${AppTeamURL}" target="blank" class="AIPRM__text-sm AIPRM__text-gray-500 AIPRM__underline">Manage My Teams</a>`
                              : ''
                          }
                        </div>
                        `
                        : ''
                    }
                  </div>

                  ${
                    this.Client.UserQuota?.hasTeamsFeatureEnabled() &&
                    prompt.PromptTypeNo === PromptTypeNo.PRIVATE &&
                    this.Lists.withType(ListTypeNo.TEAM_CUSTOM) !== undefined
                      ? /*html*/ `
                      <p class="AIPRM__mt-4 AIPRM__text-[10px]" id="privatePromptInTeamList">Private prompts cannot be shared in Team lists. Please update prompt to Team prompt before adding it to Team list.</p>
                      `
                      : ''
                  }

                </div>

                <div class="AIPRM__bg-gray-200 dark:AIPRM__bg-gray-700 AIPRM__px-4 AIPRM__py-3 AIPRM__text-right">
                  <button type="button" class="AIPRM__bg-gray-600 hover:AIPRM__bg-gray-800 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white"
                          onclick="AIPRM.hideModal('listSelectionModal')"> Cancel
                  </button>
                  <button type="submit" class="AIPRM__bg-green-600 hover:AIPRM__bg-green-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white">Add to list</button>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;

    // add event listener to show/hide "Create a new list" section
    const listIDSelect = listSelectionModal.querySelector(
      'select[name="listID"]'
    );

    listIDSelect.addEventListener('change', (e) => {
      const createNewListSection =
        listSelectionModal.querySelector('#createNewList');

      if (e.target.value === '') {
        createNewListSection.classList.remove('AIPRM__hidden');
        return;
      }

      createNewListSection.classList.add('AIPRM__hidden');
    });

    listSelectionModal.style = 'display: block;';

    // add event listener to close the modal on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideModal('listSelectionModal');
      }
    });
  },

  toggleCreateNewListSelectTeam(e) {
    const checkbox = document.querySelector('#createNewListShareWithTeam');
    const section = document.querySelector('#createNewListSelectTeam');

    if (checkbox.checked) {
      section.classList.remove('AIPRM__hidden');
    } else {
      section.classList.add('AIPRM__hidden');
    }
  },

  // Handle submit of list selection modal form and add prompt to list or create a new list and add prompt to it
  async handleListSelectionModalSubmit(promptToSave = undefined, e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    const listID = formData.get('listID');
    const listName = formData.get('listName')?.trim();

    // no list selected and no list name entered
    if (!listID && !listName) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Please select a list or create a new one.'
      );
      return;
    }

    const shareWithTeamCheckbox = document.querySelector(
      '#createNewListShareWithTeam'
    );
    const shareWithTeam =
      shareWithTeamCheckbox && shareWithTeamCheckbox.checked;
    const forTeamID = formData.get('createNewListSelectTeam');

    if (!shareWithTeam && !listID) {
      if (!this.Client.UserQuota.canUseCustomList()) {
        return;
      }
    }

    const promptID = formData.get('promptID');

    let list;

    try {
      // existing list - add prompt to it
      if (listID) {
        if (promptToSave) {
          await this.Client.savePrompt(promptToSave, listID);

          list = this.Lists.withID(listID);

          const creationTime = new Date();
          list.list.Items.push({
            Comment: '',
            CreationTime: creationTime.toISOString(),
            ItemOrder: 0,
            ItemStatusNo: ItemStatusNo.ACTIVE,
            ListID: listID,
            PromptID: promptID,
            RevisionTime: creationTime.toISOString(),
          });
        } else {
          list = this.Lists.withID(listID);

          if (!this.Client.UserQuota.canAddToCustomList(list)) {
            return;
          }

          await list.add({ ID: promptID });
        }
      }
      // new team list - create it and add prompt to it
      else if (shareWithTeam) {
        if (!forTeamID) {
          this.showNotification(
            NotificationSeverity.ERROR,
            'Please select a team.'
          );
          return;
        }

        list = await this.Lists.create(
          this.Client,
          ListTypeNo.TEAM_CUSTOM,
          listName,
          {
            PromptID: promptID,
            Comment: '',
          },
          forTeamID
        );
      }
      // new list - create it and add prompt to it
      else {
        if (!this.Client.UserQuota.canCreateCustomList(this.Lists)) {
          return;
        }

        list = await this.Lists.create(
          this.Client,
          ListTypeNo.CUSTOM,
          listName,
          {
            PromptID: promptID,
            Comment: '',
          }
        );
      }
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not add to list. ${
          error instanceof Reaction ? error.message : ''
        }`
      );

      if (
        error instanceof Reaction &&
        error.ReactionNo === ReactionNo.RXN_AIPRM_QUOTA_EXCEEDED
      ) {
        listID
          ? this.Client.UserQuota.listItemQuotaExceeded()
          : this.Client.UserQuota.listQuotaExceeded();
      }

      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      `Added to "${sanitizeInput(list.Comment)}" prompts list.`
    );

    this.hideModal('listSelectionModal');

    // re-insert the prompt templates section if it's a new list
    if (!listID || listID === this.PromptTemplatesList) {
      this.insertPromptTemplatesSection();
    }
  },

  /**
   * Show create list modal
   */
  showListCreateModal() {
    let listCreateModal = document.getElementById('listCreateModal');

    // if modal does not exist, create it, add event listener on submit and append it to body
    if (!listCreateModal) {
      listCreateModal = document.createElement('div');
      listCreateModal.id = 'listCreateModal';

      listCreateModal.addEventListener(
        'submit',
        this.handleListCreateModalSubmit.bind(this)
      );

      document.body.appendChild(listCreateModal);
    }

    listCreateModal.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__text-center AIPRM__transition-opacity AIPRM__z-50">
        <div class="AIPRM__absolute AIPRM__bg-gray-900 AIPRM__inset-0 AIPRM__opacity-90">
        </div>

        <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__overflow-y-auto">
          <div class="AIPRM__flex AIPRM__items-center AIPRM__justify-center AIPRM__min-h-full">
            <form>
              <div
                class="AIPRM__align-center AIPRM__bg-white dark:AIPRM__bg-gray-800 dark:AIPRM__text-gray-200 AIPRM__inline-block AIPRM__overflow-hidden sm:AIPRM__rounded-lg AIPRM__shadow-xl sm:AIPRM__align-middle sm:AIPRM__max-w-lg sm:AIPRM__my-8 sm:AIPRM__w-full AIPRM__text-left AIPRM__transform AIPRM__transition-all"
                role="dialog" aria-modal="true" aria-labelledby="modal-headline">

                <div class="AIPRM__bg-white dark:AIPRM__bg-gray-800 AIPRM__px-4 AIPRM__pt-5 AIPRM__pb-4 sm:AIPRM__p-6 sm:AIPRM__pb-4 AIPRM__w-96">

                  <h3 class="${css`h3`} AIPRM__my-4">Create a new list</h3>

                    <label class="AIPRM__block">List Name</label>
                    <input type="text" name="listName" class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full" required>

                    ${
                      this.Client.UserQuota?.hasTeamsFeatureEnabled()
                        ? /*html*/ `
                        <label class="AIPRM__text-sm AIPRM__flex AIPRM__items-center" id="savePromptForm-public-checkbox">
                          <input id="createNewListShareWithTeam" name="createNewListShareWithTeam" 
                            type="checkbox" class="AIPRM__mr-2 dark:AIPRM__bg-gray-700" 
                            onchange="AIPRM.toggleCreateNewListSelectTeam();"> 
                          Share with Team
                        </label>

                        <div id="createNewListSelectTeam" class="AIPRM__hidden">
                          <select id="createNewListSelectTeam" name="createNewListSelectTeam" class="AIPRM__mt-2 AIPRM__mb-3 dark:AIPRM__bg-gray-700 dark:AIPRM__border-gray-700 dark:hover:AIPRM__bg-gray-900 AIPRM__rounded AIPRM__w-full">
                            ${
                              this.Client.OwnTeamS?.length > 0
                                ? this.Client.OwnTeamS.map(
                                    (team) =>
                                      /*html*/ `<option value="${sanitizeInput(
                                        team.TeamID
                                      )}">${sanitizeInput(
                                        team.TeamName
                                      )}</option>`
                                  ).join('')
                                : /*html*/ `<option value="NEW">My First Team</option>`
                            }
                          </select>

                          ${
                            this.Client.OwnTeamS?.length > 0
                              ? /*html*/ `<a href="${AppTeamURL}" target="blank" class="AIPRM__text-sm AIPRM__text-gray-500 AIPRM__underline">Manage My Teams</a>`
                              : ''
                          }
                        </div>
                        `
                        : ''
                    }
                </div>

                <div class="AIPRM__bg-gray-200 dark:AIPRM__bg-gray-700 AIPRM__px-4 AIPRM__py-3 AIPRM__text-right">
                  <button type="button" class="AIPRM__bg-gray-600 hover:AIPRM__bg-gray-800 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white"
                          onclick="AIPRM.hideModal('listCreateModal')"> Cancel
                  </button>
                  <button type="submit" class="AIPRM__bg-green-600 hover:AIPRM__bg-green-700 AIPRM__mr-2 AIPRM__px-4 AIPRM__py-2 AIPRM__rounded AIPRM__text-white">Create list</button>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;

    listCreateModal.style = 'display: block;';

    // add event listener to close the modal on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideModal('listCreateModal');
      }
    });
  },

  // Handle submit of list create modal form and create a new list
  async handleListCreateModalSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    const listName = formData.get('listName')?.trim();

    // no list name entered
    if (!listName) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Please specify list name.'
      );
      return;
    }

    const shareWithTeamCheckbox = document.querySelector(
      '#createNewListShareWithTeam'
    );
    const shareWithTeam =
      shareWithTeamCheckbox && shareWithTeamCheckbox.checked;
    const forTeamID = formData.get('createNewListSelectTeam');

    if (!shareWithTeam) {
      if (!this.Client.UserQuota.canUseCustomList()) {
        return;
      }
    }

    let list;

    try {
      if (shareWithTeam) {
        if (!forTeamID) {
          this.showNotification(
            NotificationSeverity.ERROR,
            'Please select a team.'
          );
          return;
        }

        list = await this.Lists.create(
          this.Client,
          ListTypeNo.TEAM_CUSTOM,
          listName,
          {},
          forTeamID
        );

        // init list with empty Items
        list.list.Items = [];
      }
      // new list - create it and add prompt to it
      else {
        if (!this.Client.UserQuota.canCreateCustomList(this.Lists)) {
          return;
        }

        list = await this.Lists.create(
          this.Client,
          ListTypeNo.CUSTOM,
          listName,
          {}
        );

        // init list with empty Items
        list.list.Items = [];
      }
    } catch (error) {
      if (
        error instanceof Reaction &&
        error.ReactionNo === ReactionNo.RXN_AIPRM_QUOTA_EXCEEDED
      ) {
        this.Client.UserQuota.listQuotaExceeded();
      } else {
        this.showNotification(
          NotificationSeverity.ERROR,
          `Could not create list. ${
            error instanceof Reaction ? error.message : ''
          }`
        );
      }

      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      `Created "${sanitizeInput(list.Comment)}" prompts list.`
    );

    this.hideModal('listCreateModal');

    this.insertPromptTemplatesSection();
  },

  /**
   * Edit a custom list's name, then re-insert the prompt templates section
   *
   * @param {List['ID]} listID
   */
  async editCustomList(listID) {
    const list = this.Lists.withID(listID);

    // Ask for new name
    const listName = prompt(
      'Please enter a new name for the list:',
      sanitizeInput(list.Comment)
    );

    // Abort if no name was entered
    if (!listName) {
      return;
    }

    try {
      // Update the list using the API and update it in the local list of lists
      await list.update(listName);
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not update list. ${
          error instanceof Reaction ? error.message : ''
        }`
      );
      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      `Updated prompts list "${sanitizeInput(list.Comment)}".`
    );

    this.insertPromptTemplatesSection();
  },

  /**
   * Delete a custom list after confirmation, then re-insert the prompt templates section
   *
   * @param {List['ID]} listID
   */
  async deleteCustomList(listID) {
    const list = this.Lists.withID(listID);

    // Ask for confirmation
    if (
      !confirm(
        `Are you sure you want to delete list "${sanitizeInput(list.Comment)}"?`
      )
    ) {
      return;
    }

    try {
      // delete the list using the API and remove it from the local list of lists
      await this.Lists.delete(list);
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        `Could not delete list. ${
          error instanceof Reaction ? error.message : ''
        }`
      );
      return;
    }

    this.showNotification(
      NotificationSeverity.SUCCESS,
      `Deleted list "${sanitizeInput(list.Comment)}".`
    );

    // reset the list of lists and the selected list type after deleting a list
    this.PromptTemplatesList = null;

    this.PromptTemplatesType = PromptTemplatesType.PUBLIC;

    this.insertPromptTemplatesSection();
  },

  // Explain how to use the "Favorites" prompts list in case of no prompts in the list
  howToUseFavoriteList() {
    this.showNotification(
      NotificationSeverity.INFO,
      'To add a prompt to your "Favorites" prompts list, click the star icon next to the prompt title.'
    );
  },

  // Explain how to use the "Hidden" prompts list in case of no prompts in the list
  howToUseHiddenList() {
    this.showNotification(
      NotificationSeverity.INFO,
      'To add prompt to your "Hidden" prompts list and hide it, click the cross icon next to the prompt title.'
    );
  },

  /**
   * Check if prompt is in the "AIPRM Verified Prompts" list
   *
   * @param {number} idx
   * @returns {Promise<boolean>}
   */
  async isVerified(idx) {
    const list = this.Lists.getAIPRMVerified();

    // no AIPRM Verified list
    if (!list) {
      return false;
    }

    // cannot use AIPRM Verified list
    if (!this.Client.UserQuota.canUseAIPRMVerifiedList(false)) {
      return false;
    }

    const prompt = (await this.getCurrentPromptTemplates())[idx];

    return await list.has(prompt);
  },

  // Show AIPRM Account modal (connect/disconnect AIPRM account, current AIPRM Plan level and OpenAI account)
  showAccountModal() {
    let accountModal = document.getElementById('AIPRM__accountModal');

    // if modal does not exist, create it, add event listener on submit and append it to body
    if (!accountModal) {
      accountModal = document.createElement('div');
      accountModal.id = 'AIPRM__accountModal';

      document.body.appendChild(accountModal);
    }

    accountModal.innerHTML = /*html*/ `
      <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__text-center AIPRM__transition-opacity AIPRM__z-50">
        <div class="AIPRM__absolute AIPRM__bg-gray-900 AIPRM__inset-0 AIPRM__opacity-90">
        </div>

        <div class="AIPRM__fixed AIPRM__inset-0 AIPRM__overflow-y-auto">
          <div class="AIPRM__flex AIPRM__items-center AIPRM__justify-center AIPRM__min-h-full">

            <div
              class="AIPRM__align-center AIPRM__bg-white dark:AIPRM__bg-gray-800 dark:AIPRM__text-gray-200 AIPRM__inline-block AIPRM__overflow-hidden sm:AIPRM__rounded-lg AIPRM__shadow-xl sm:AIPRM__align-middle sm:AIPRM__max-w-lg sm:AIPRM__my-8 sm:AIPRM__w-full AIPRM__text-left AIPRM__transform AIPRM__transition-all"
              role="dialog" aria-modal="true" aria-labelledby="modal-headline">

                <div class="AIPRM__border-b dark:AIPRM__border-gray-700 AIPRM__px-6 AIPRM__flex AIPRM__w-full AIPRM__flex-row AIPRM__items-center AIPRM__justify-between">
                  <h2 class="AIPRM__py-3 AIPRM__text-lg AIPRM__font-medium AIPRM__leading-6 AIPRM__text-gray-900 dark:AIPRM__text-gray-200">
                    Your AIPRM Account
                  </h2>
                  <button class="AIPRM__text-gray-700 AIPRM__opacity-50 AIPRM__transition hover:AIPRM__opacity-75 dark:AIPRM__text-white AIPRM__pl-2"
                    onclick="AIPRM.hideModal('AIPRM__accountModal')">
                    ${svg('CrossLarge')}
                  </button>
                </div>                
          
                <div class="AIPRM__bg-white dark:AIPRM__bg-gray-800 AIPRM__p-4 AIPRM__px-6 AIPRM__overflow-y-auto">

                  <dl class="AIPRM__text-sm">
                    <div class="AIPRM__flex AIPRM__py-4 AIPRM__flex-col sm:AIPRM__flex-row AIPRM__border-b dark:AIPRM__border-gray-700">
                      <dt class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__font-medium">AIPRM Account</dt>
                      <dd class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__justify-between">
                        <div style="overflow-wrap: anywhere">
                          ${
                            this.Client.User.IsLinked
                              ? `${sanitizeInput(this.Client.AppUser.Email)}`
                              : 'Not Connected with AIPRM Account'
                          }
                        </div>
                        ${
                          this.Client.User.IsLinked
                            ? /*html*/ `
                              <a class="AIPRM__inline-block AIPRM__mt-4 AIPRM__bg-white AIPRM__border AIPRM__border-green-500 hover:AIPRM__border-green-700 AIPRM__text-green-500 hover:AIPRM__text-green-700 AIPRM__py-2 AIPRM__px-3 AIPRM__rounded dark:AIPRM__bg-gray-800 dark:hover:AIPRM__text-green-400 dark:hover:AIPRM__border-green-400" href="${AppAccountURL}" target="_blank">
                                View Account
                              </a>
                              <button class="AIPRM__block sm:AIPRM__inline-block sm:AIPRM__ml-2 AIPRM__mt-4 AIPRM__bg-white AIPRM__border AIPRM__border-red-500 hover:AIPRM__border-red-700 AIPRM__text-red-500 hover:AIPRM__text-red-700 AIPRM__py-2 AIPRM__px-3 AIPRM__rounded dark:AIPRM__bg-gray-800 dark:hover:AIPRM__text-red-400 dark:hover:AIPRM__border-red-400" onclick="AIPRM.disconnectAccount()">
                                Disconnect
                              </button>
                            `
                            : /*html*/ `
                              <a class="AIPRM__inline-block AIPRM__mt-4 AIPRM__bg-white AIPRM__border AIPRM__border-green-500 hover:AIPRM__border-green-700 AIPRM__text-green-500 hover:AIPRM__text-green-700 AIPRM__py-2 AIPRM__px-3 AIPRM__rounded dark:AIPRM__bg-gray-800 dark:hover:AIPRM__text-green-400 dark:hover:AIPRM__border-green-400" href="${AppAccountURL}?action=connect" target="_blank">
                                Connect
                              </a>
                            `
                        }
                      </dd>
                    </div>

                    <div class="AIPRM__flex AIPRM__py-4 AIPRM__flex-col sm:AIPRM__flex-row AIPRM__border-b dark:AIPRM__border-gray-700">
                      <dt class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__font-medium">OpenAI Account</dt>
                      <dd class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__justify-between">
                        <div>
                           ${sanitizeInput(
                             window.__NEXT_DATA__?.props?.pageProps?.user
                               ?.email || 'Unknown'
                           )}
                        </div>
                      </dd>
                    </div>

                    <div class="AIPRM__flex AIPRM__py-4 AIPRM__flex-col sm:AIPRM__flex-row AIPRM__border-b dark:AIPRM__border-gray-700">
                      <dt class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__font-medium">AIPRM Teams</dt>
                      <dd class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__justify-between">
                          <a class="AIPRM__inline-block AIPRM__mt-1 AIPRM__bg-white AIPRM__border AIPRM__border-green-500 hover:AIPRM__border-green-700 AIPRM__text-green-500 hover:AIPRM__text-green-700 AIPRM__py-2 AIPRM__px-3 AIPRM__rounded dark:AIPRM__bg-gray-800 dark:hover:AIPRM__text-green-400 dark:hover:AIPRM__border-green-400" href="${AppTeamURL}" target="_blank">
                            Manage My Teams
                          </a>
                      </dd>
                    </div>

                    <div class="AIPRM__flex AIPRM__py-4 AIPRM__flex-col sm:AIPRM__flex-row AIPRM__border-b dark:AIPRM__border-gray-700">
                      <dt class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__font-medium">AIPRM Plan Level</dt>
                      <dd class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__justify-between">
                        <div>
                          ${this.Client.UserQuota.getMaxPlanLevelLabel()}
                        </div>

                        <a class="AIPRM__inline-block AIPRM__mt-4 AIPRM__bg-white AIPRM__border AIPRM__border-green-500 hover:AIPRM__border-green-700 AIPRM__text-green-500 hover:AIPRM__text-green-700 AIPRM__py-2 AIPRM__px-3 AIPRM__rounded dark:AIPRM__bg-gray-800 dark:hover:AIPRM__text-green-400 dark:hover:AIPRM__border-green-400" href="${AppPricingURL}" target="_blank">
                          Upgrade
                        </a>
                      </dd>
                    </div>                    

                    <div class="AIPRM__flex AIPRM__py-4 AIPRM__flex-col sm:AIPRM__flex-row AIPRM__border-b dark:AIPRM__border-gray-700">
                      <dt class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__font-medium">My Profile Info</dt>
                      <dd class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__justify-between">
                        <a class="AIPRM__inline-block AIPRM__bg-white AIPRM__border AIPRM__border-green-500 hover:AIPRM__border-green-700 AIPRM__text-green-500 hover:AIPRM__text-green-700 AIPRM__py-2 AIPRM__px-3 AIPRM__rounded dark:AIPRM__bg-gray-800 dark:hover:AIPRM__text-green-400 dark:hover:AIPRM__border-green-400" href="${AppAccountURL}#myprofileinfo" target="_blank">
                          Manage My Profile Info
                        </a>
                      </dd>
                    </div>

                    <div class="AIPRM__flex AIPRM__py-4 AIPRM__flex-col sm:AIPRM__flex-row">
                      <dt class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__font-medium">Settings</dt>
                      <dd class="AIPRM__w-full sm:AIPRM__w-1/2 AIPRM__py-2 AIPRM__justify-between">
                        <label class="AIPRM__text-sm AIPRM__flex AIPRM__items-center" id="savePromptForm-public-checkbox">
                          <input id="accountModal-hideWatermark" type="checkbox" class="AIPRM__mr-2 dark:AIPRM__bg-gray-700" 
                            onchange="AIPRM.toggleHideAIPRMWatermark()" ${
                              this.getHideWatermark() ? 'checked' : ''
                            }> 
                          Hide AIPRM Watermark
                        </label>
                      </dd>
                    </div>

                  </dl>

                </div>
              </div>
          </div>
        </div>
        
      </div>
    `;

    accountModal.style = 'display: block;';

    // add event listener to close the modal on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideModal('AIPRM__accountModal');
      }
    });
  },

  // Disconnect the user's AIPRM account
  async disconnectAccount() {
    if (!confirm('Are you sure you want to disconnect your AIPRM account?')) {
      return;
    }

    // unlink the AIPRM account and user
    try {
      await this.Client.unlinkUser();
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Could not disconnect your AIPRM account, please try again later.',
        false
      );

      return;
    }

    try {
      // refresh AIPRM user profile and quota
      await this.Client.checkUserStatus();

      // show notification if connection status is not updated, yet
      if (this.Client.User.IsLinked) {
        this.showNotification(
          NotificationSeverity.INFO,
          'Disconnecting your AIPRM account, please wait...',
          false
        );
      }

      // wait for CheckUserStatus to update the connection status, quotas and user profile
      while (this.Client.User.IsLinked) {
        // poll checkUserStatus every 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 5000));

        await this.Client.checkUserStatus();
      }
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Could not get user status, please try again later.',
        false
      );

      return;
    }

    // hide the modal
    this.hideModal('AIPRM__accountModal');

    // show notification
    this.showNotification(
      NotificationSeverity.SUCCESS,
      'Your AIPRM account has been disconnected successfully.',
      false
    );

    // reset App User
    this.Client.AppUser = null;

    // refresh the prompt templates section to show link to login
    await this.insertPromptTemplatesSection();
  },

  // Get the user's profile message from localStorage
  getHideWatermark() {
    if (!this.Client.UserQuota.canUseHideWatermark(false)) {
      return '';
    }

    return localStorage.getItem(hideWatermarkKey) || '';
  },

  toggleHideAIPRMWatermark() {
    const checkbox = document.getElementById('accountModal-hideWatermark');

    // check if user can use hide watermark
    if (!this.Client.UserQuota.canUseHideWatermark()) {
      checkbox.checked = false;
      return;
    }

    // update local storage
    try {
      localStorage.setItem(hideWatermarkKey, checkbox.checked ? 'true' : '');
    } catch (error) {
      this.showNotification(
        NotificationSeverity.ERROR,
        'Could not update Hide AIPRM Watermark setting, please try again later.',
        false
      );

      checkbox.checked = false;
      return;
    }
  },

  // Reset the option to include the user's profile message
  resetIncludeMyProfileInfo() {
    // reset the flag
    this.IncludeMyProfileMessage = false;

    // uncheck the checkbox if it exists
    const checkbox = document.querySelector('input[name="includeMyProfile"]');
    if (checkbox) {
      checkbox.checked = false;
    }
  },

  // Prefill prompt input with the prompt from URL or message
  prefillPromptInput() {
    // Get the prompt from URL
    const prompt =
      this.PrefillPrompt ||
      new URLSearchParams(window.location.search).get(queryParamPrompt);

    // If prompt is empty return
    if (!prompt) {
      return;
    }

    // Reset the prefill prompt
    this.PrefillPrompt = null;

    // Get the prompt textarea input
    const textarea = document.querySelector(
      this.Config.getSelectorConfig().PromptTextarea
    );

    // If there is no textarea, skip
    if (!textarea) {
      console.error('prefillPromptInput: No textarea found');
      return;
    }

    // Add the continue action prompt to the textarea
    textarea.value = prompt;
    textarea.focus();

    // Dispatch the input event to trigger the event listeners and enable the "Submit" button
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  },
};

window.AIPRM.init();
