import settingsRepository from './../../repositories/settingsRepository';

const state = {
  wasImported: true,
  itemCreationDate: true,
  prependNewItems: true,
  stickBoardsOnTop: false,
  markdownMode: true,
  dbLocation: '',
  darkTheme: false,
  showUpdates: true,
  keyBindings: settingsRepository.keyBindings,
  token: '',
  username: '',
  language: '',
  languages: [
    {
      code: 'ptBR',
      label: 'Brazilian Portuguese',
    },
    {
      code: 'zh',
      label: '中文',
    },
    {
      code: 'en',
      label: 'English',
    }, {
      code: 'hr',
      label: 'Croatian',
    },
    {
      code: 'pl',
      label: 'Polish',
    },
  ],
};

const mutations = {
  SET_SETTINGS(state, settings) {
    state.keyBindings = {...state.keyBindings, ...settings.keyBindings};
    Object.assign(state, settings);
  },
  SET_DB_LOCATION(state, newDbLocation) {
    state.dbLocation = newDbLocation;
  },
  SET_DARK_THEME(state, val) {
    state.darkTheme = val;
  },
  SET_ITEM_CREATION_DATE(state, val) {
    state.itemCreationDate = val;
  },
  SET_SHOW_UPDATES(state, val) {
    state.showUpdates = val;
  },
  SET_LANGUAGE(state, val) {
    state.language = val;
  },
};

const actions = {
  async fetchSettings({commit}) {
    const settings = await settingsRepository.getAppSettings();
    commit('SET_CLOUD_TOKEN', settings.token);
    commit('SET_CLOUD_USER', settings.username);
    commit('SET_CLOUD_LAST_SYNC', settings.lastSync);
    commit('SET_SETTINGS', settings);
  },
  async setDbLocation({commit}, dbLocation) {
    commit('SET_DB_LOCATION', dbLocation);
    await settingsRepository.updateAppSettings({dbLocation});
  },
  async setDarkTheme({commit}, darkTheme) {
    commit('SET_DARK_THEME', darkTheme);
    await settingsRepository.updateAppSettings({darkTheme});
  },
  async setItemCreationDate({commit}, itemCreationDate) {
    commit('SET_ITEM_CREATION_DATE', itemCreationDate);
    await settingsRepository.updateAppSettings({itemCreationDate});
  },
  async setShowUpdates({commit}, showUpdates) {
    commit('SET_SHOW_UPDATES', showUpdates);
    await settingsRepository.updateAppSettings({showUpdates});
  },
  async setupKeyBindings() {
    const hasKeyBindings = await settingsRepository.hasKeyBindingsProperty();
    if (!hasKeyBindings) {
      await settingsRepository.setupKeyBindings();
    } else {
      const repoKeys = await settingsRepository.getKeyBindings();
      for (let property in settingsRepository.keyBindings) {
        if (!repoKeys[property]) {
          await settingsRepository.addKeyBinding(property, settingsRepository.keyBindings[property]);
        }
      }
    }
  },
  async changeLanguage({commit}, code) {
    await settingsRepository.updateAppSettings({language: code});
    commit('SET_LANGUAGE', code);
  },
  async resetKeyBindings() {
    await settingsRepository.setupKeyBindings();
  },
  async updateKeyBinding(context, {id, combination, isMac}) {
    await settingsRepository.updateKeyBinding(id, combination, isMac);
  },
};

export default {
  state,
  mutations,
  actions,
};
