// Change the currentEnvironment variable to switch between environments (local, test, production)
const currentEnvironment = 'production';

// Define environment-specific constants (API endpoints, etc.)
const getEnvironmentConfig = () => {
  switch (currentEnvironment) {
    case 'production':
      return {
        APIEndpoint: 'https://api.aiprm.com/api6',
        APIEndpointAPP: 'https://app1.aiprm.com/api',
        AppAccountURL: 'https://app1.aiprm.com/account',
        AppPricingURL: 'https://app1.aiprm.com/pricing',
        AppSignupURL: 'https://app1.aiprm.com/signup',
        AppTeamURL: 'https://app1.aiprm.com/teams',
      };
    case 'test':
      return {
        APIEndpoint: 'https://test-api.aiprm.com/api4',
        APIEndpointAPP: 'https://test-app.aiprm.com/api',
        AppAccountURL: 'https://test-app.aiprm.com/account',
        AppPricingURL: 'https://test-app.aiprm.com/pricing',
        AppSignupURL: 'https://test-app.aiprm.com/signup',
        AppTeamURL: 'https://test-app.aiprm.com/teams',
      };
    case 'local':
      return {
        APIEndpoint: 'https://dev-api.aiprm.com/api4',
        APIEndpointAPP: 'https://dev-app.aiprm.com/api',
        AppAccountURL: 'https://dev-app.aiprm.com/account',
        AppPricingURL: 'https://dev-app.aiprm.com/pricing',
        AppSignupURL: 'https://dev-app.aiprm.com/signup',
        AppTeamURL: 'https://dev-app.aiprm.com/teams',
      };
    default:
      return {
        APIEndpoint: 'https://api.aiprm.com/api6',
        APIEndpointAPP: 'https://app1.aiprm.com/api',
        AppAccountURL: 'https://app1.aiprm.com/account',
        AppPricingURL: 'https://app1.aiprm.com/pricing',
        AppSignupURL: 'https://app1.aiprm.com/signup',
        AppTeamURL: 'https://app1.aiprm.com/teams',
      };
  }
};

// Get environment-specific constants
const environmentConfig = getEnvironmentConfig();

// Define global constants based on environment-specific constants
const APIEndpoint = environmentConfig.APIEndpoint;
const APIEndpointAPP = environmentConfig.APIEndpointAPP;
const AppAccountURL = environmentConfig.AppAccountURL;
const AppPricingURL = environmentConfig.AppPricingURL;
const AppSignupURL = environmentConfig.AppSignupURL;
const AppTeamURL = environmentConfig.AppTeamURL;

// Define global constants
const PromptPlaceholder = '[PROMPT]';
const TargetLanguagePlaceholder = '[TARGETLANGUAGE]';
const CrawledTextPlaceholder = '[CRAWLEDTEXT]';
const CrawledSourcePlaceholder = '[CRAWLEDSOURCE]';
const VariablePlaceholder = '[VARIABLE{idx}]';
const VariableDefinition = /\[VARIABLE([1-6]):(.+?)(:.*?)?(:.*?)?\]/g;
const LanguageFeedURL = 'https://api.aiprm.com/csv/languages-20230119.csv?v=';
const TopicFeedURL = 'https://api.aiprm.com/csv/topics-20230123.csv?v=';
const ActivityFeedURL = 'https://api.aiprm.com/csv/activities-20230124.csv?v=';
const ToneFeedURL = 'https://api.aiprm.com/csv/tones-v2-20230216.csv?v=';
const WritingStyleFeedURL =
  'https://api.aiprm.com/csv/writing_styles-v2-20230216.csv?v=';
const ContinueActionsFeedURL =
  'https://api.aiprm.com/csv/continue_actions-20230216.csv?v=';
const ModelFeedURL = 'https://api.aiprm.com/csv/models-20230612.csv?v=';
const PromptBuilderFeedURL =
  'https://api.aiprm.com/csv/prompt_builder-20230811.csv?v=';
const AppShort = 'AIPRM';
const AppName = 'AIPRM for ChatGPT';
const AppSlogan = 'AIPRM - ChatGPT Prompts';
const AppSloganPremium = 'AIPRM Premium - ChatGPT Prompts';
const AppURL =
  'https://www.aiprm.com/?via=chatgpt&utm_campaign=powered&utm_source=chatgpt&utm_medium=navlink&utm_content=AIPRMpowered';
const ExportFilePrefix = 'AIPRM-export-chatgpt-thread_';
const ExportHeaderPrefix =
  '\n```\nExported with AIPRM https://www.aiprm.com by ';
const AppCommunityForumURL =
  'https://forum.aiprm.com/categories?via=chatgpt&utm_campaign=community&utm_source=chatgpt&utm_medium=navlink&utm_content=AIPRMcommunity';
const QuotaMessagesURL =
  'https://api.aiprm.com/json/quota-messages-20230324.json?v=';
const ConfigURL = 'https://api.aiprm.com/json/config-20231111.json?v=';

const ValidateVariableMaxCount = 6;
const ValidateVariablePlaceholder = /\[VARIABLE([0-9]+)\]/g;
const ValidateVariableDefinition = /\[VARIABLE([0-9]+):(.+?)(:.*?)?(:.*?)?\]/g;

export {
  PromptPlaceholder,
  TargetLanguagePlaceholder,
  CrawledTextPlaceholder,
  CrawledSourcePlaceholder,
  VariablePlaceholder,
  VariableDefinition,
  LanguageFeedURL,
  AppShort,
  AppName,
  AppSlogan,
  AppSloganPremium,
  AppURL,
  ExportFilePrefix,
  ExportHeaderPrefix,
  APIEndpoint,
  TopicFeedURL,
  ActivityFeedURL,
  ToneFeedURL,
  WritingStyleFeedURL,
  ContinueActionsFeedURL,
  ModelFeedURL,
  PromptBuilderFeedURL,
  APIEndpointAPP,
  AppAccountURL,
  AppCommunityForumURL,
  AppPricingURL,
  AppSignupURL,
  QuotaMessagesURL,
  ConfigURL,
  AppTeamURL,
  ValidateVariableMaxCount,
  ValidateVariablePlaceholder,
  ValidateVariableDefinition,
};

/** @typedef {{Enabled: boolean, Config: {APIEndpointURL: string, MaxCharacters: number, MaxWords: number, CrawledTextPrompt: string, CrawledSourcePrompt: string}}} LiveCrawlingConfig */

/** @typedef {{Enabled: boolean, Config: {Selectors: Object.<string, string>}} WatermarkConfig */

/**
 * @typedef {Object} SelectorConfig
 * @property {string} FirstPrompt
 * @property {string} FirstPromptButtons
 * @property {string} ChatLogContainer
 * @property {string} ConversationResponse
 * @property {string} ModelSelectorContainer
 * @property {string} ShareButton
 * @property {string} SuggestedPrompts
 * @property {string} DashboardTitle
 * @property {string} Sidebar
 * @property {string} ExportButton
 * @property {string} ExportButtonChatStarted
 * @property {string} PromptTextarea
 * @property {string} PromptSubmitButton
 * @property {string} ConversationResponseWrapper
 * @property {string} NewChatSidebar
 * @property {string} NewChatSidebarButton
 * @property {string} NewChatSidebarButtonText
 * @property {string} NewChatTopbar
 * @property {string} NewChatTopbarButton
 * @property {string} ElementAddedSidebarID1
 * @property {string} ElementAddedSidebarID2
 * @property {string} ElementAddedExportButtonDisable
 * @property {string} ElementAddedExportButtonEnable
 * @property {string} ElementAddedSavePromptAsTemplate
 * @property {string} LangWrapperSpacer
 * @property {string} SavePromptAsTemplatePromptText
 * @property {string} GizmosTitle
 * @property {number} GizmosTitleIndex
 */

/** @typedef {{Selector: string, Add: string[], Remove: string[]}} LayoutChangeConfig */

/** @typedef {{PromptTemplates: LayoutChangeConfig[], General: LayoutChangeConfig[]}} LayoutChangesConfig */

/** @typedef {{Enabled: boolean, Config: {EndpointConversation: string, EndpointMessageFeedback: string, FeedbackTextField: string, FeedbackRatingField: string, FeedbackThumbsDown: string, FeedbackThumbsUp: string, GizmoCodePattern: string}}} PromptTemplatesConfig */

/** @typedef {{Features: {LiveCrawling: LiveCrawlingConfig, Watermark: WatermarkConfig, PromptTemplates: PromptTemplatesConfig}, EndpointGizmos: string, Selectors: SelectorConfig, LayoutChanges: LayoutChangesConfig}} RemoteConfig */

export class Config {
  /** @type {RemoteConfig} */
  #config;

  /** @param {RemoteConfig} config */
  constructor(config) {
    this.#config = config;
  }

  /** @returns {boolean} */
  isLiveCrawlingEnabled() {
    return this.#config.Features.LiveCrawling.Enabled === true;
  }

  /** @returns {LiveCrawlingConfig['Config']} */
  getLiveCrawlingConfig() {
    return this.#config.Features.LiveCrawling.Config;
  }

  /** @returns {boolean} */
  arePromptTemplatesEnabled() {
    return this.#config.Features.PromptTemplates.Enabled === true;
  }

  /** @returns {PromptTemplatesConfig['Config']} */
  getPromptTemplatesConfig() {
    return this.#config.Features.PromptTemplates.Config;
  }

  /** @returns {boolean} */
  isWatermarkEnabled() {
    return this.#config.Features.Watermark.Enabled === true;
  }

  /** @returns {WatermarkConfig['Config']} */
  getWatermarkConfig() {
    return this.#config.Features.Watermark.Config;
  }

  /** @returns {EndpointGizmos} */
  getEndpointGizmos() {
    return this.#config.EndpointGizmos;
  }

  /** @returns {SelectorConfig} */
  getSelectorConfig() {
    return this.#config.Selectors;
  }

  /** @returns {LayoutChangesConfig} */
  getLayoutChangesConfig() {
    return this.#config.LayoutChanges;
  }
}
