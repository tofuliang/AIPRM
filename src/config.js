// Change the currentEnvironment variable to switch between environments (local, test, production)
const currentEnvironment = 'production';

// Define environment-specific constants (API endpoints, etc.)
const getEnvironmentConfig = () => {
  switch (currentEnvironment) {
    case 'production':
      return {
        APIEndpoint: 'https://api.aiprm.com/api4',
        APIEndpointAPP: 'https://app1.aiprm.com/api',
        AppAccountURL: 'https://app1.aiprm.com/account',
        AppPricingURL: 'https://app1.aiprm.com/pricing',
        AppSignupURL: 'https://app1.aiprm.com/signup',
        AppTeamURL: 'https://app1.aiprm.com/teams',
      };
    case 'test':
      return {
        APIEndpoint: 'https://test-api.aiprm.com/api3',
        APIEndpointAPP: 'https://test-app.aiprm.com/api',
        AppAccountURL: 'https://test-app.aiprm.com/account',
        AppPricingURL: 'https://test-app.aiprm.com/pricing',
        AppSignupURL: 'https://test-app.aiprm.com/signup',
        AppTeamURL: 'https://test-app.aiprm.com/teams',
      };
    case 'local':
      return {
        APIEndpoint: 'https://dev-api.aiprm.com/api3',
        APIEndpointAPP: 'https://dev-app.aiprm.com/api',
        AppAccountURL: 'https://dev-app.aiprm.com/account',
        AppPricingURL: 'https://dev-app.aiprm.com/pricing',
        AppSignupURL: 'https://dev-app.aiprm.com/signup',
        AppTeamURL: 'https://dev-app.aiprm.com/teams',
      };
    default:
      return {
        APIEndpoint: 'https://api.aiprm.com/api3',
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
const EndpointConversation = 'https://chat.openai.com/backend-api/conversation';
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
const ConfigURL = 'https://api.aiprm.com/json/config-20230324.json?v=';

export {
  PromptPlaceholder,
  TargetLanguagePlaceholder,
  CrawledTextPlaceholder,
  CrawledSourcePlaceholder,
  VariablePlaceholder,
  VariableDefinition,
  LanguageFeedURL,
  EndpointConversation,
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
  APIEndpointAPP,
  AppAccountURL,
  AppCommunityForumURL,
  AppPricingURL,
  AppSignupURL,
  QuotaMessagesURL,
  ConfigURL,
  AppTeamURL,
};

/** @typedef {{Enabled: boolean, Config: {APIEndpointURL: string, MaxCharacters: number, MaxWords: number, CrawledTextPrompt: string, CrawledSourcePrompt: string}}} LiveCrawlingConfig */

/** @typedef {{Enabled: boolean, Config: {Selectors: Object.<string, string>}} WatermarkConfig */

/** @typedef {{FirstPrompt: string, ChatLogContainer: string, ConversationResponse: string, ModelSelectorContainer: string}} SelectorConfig */

/** @typedef {{Features: {LiveCrawling: LiveCrawlingConfig, Watermark: WatermarkConfig}, Selectors: SelectorConfig}} RemoteConfig */

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
  isWatermarkEnabled() {
    return this.#config.Features.Watermark.Enabled === true;
  }

  /** @returns {WatermarkConfig['Config']} */
  getWatermarkConfig() {
    return this.#config.Features.Watermark.Config;
  }

  /** @returns {SelectorConfig} */
  getSelectorConfig() {
    return this.#config.Selectors;
  }
}
