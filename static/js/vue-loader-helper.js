/**
 * CodeQuest Vue 3 SFC Dynamic Loader Helper
 * Bridges .ejs views with native .vue Single File Components using vue3-sfc-loader.
 */

window.CodeQuestVue = {
  options: {
    moduleCache: {
      vue: window.Vue
    },
    async getFile(url) {
      const res = await fetch(url);
      if (!res.ok) {
        throw Object.assign(new Error(res.statusText + ' ' + url), { res });
      }
      return {
        getContentData: (asBinary) => asBinary ? res.arrayBuffer() : res.text(),
      };
    },
    addStyle(textContent) {
      const style = Object.assign(document.createElement('style'), { textContent });
      const ref = document.head.getElementsByTagName('style')[0] || null;
      document.head.insertBefore(style, ref);
    },
    log(type, ...args) {
      console[type] && console[type]('[Vue SFC Loader]', ...args);
    }
  },

  mount(containerId, componentUrl, initialProps = {}) {
    if (!window.Vue) {
      console.error('[CodeQuest] Vue 3 is not loaded');
      return;
    }
    if (!window['vue3-sfc-loader']) {
      console.error('[CodeQuest] vue3-sfc-loader is not loaded');
      return;
    }

    const { loadModule } = window['vue3-sfc-loader'];
    const el = document.getElementById(containerId);
    if (!el) {
      console.warn(`[CodeQuest] Container #${containerId} not found`);
      return;
    }

    const RootComponent = window.Vue.defineAsyncComponent(() =>
      loadModule(componentUrl, this.options)
    );

    const app = window.Vue.createApp({
      render() {
        return window.Vue.h(RootComponent, initialProps);
      }
    });

    app.mount(el);
    return app;
  }
};
