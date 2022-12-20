class History {
  #history;

  constructor() {}

  setState = (data) => {
    this.#history = data;
    this.render(this.#history);
  };

  setData(data) {
    //save IDB

    // save State
    this.setState(data);
  }

  getData() {
    return this.#history;
  }

  like(params) {
    const { uid, tabTitle } = params;
    chrome.runtime.sendMessage({ message: "LIKE", uid, tabTitle }, () => true);
  }

  render = (dataList) => {
    // content initialize
    clearContent();

    if (!dataList || dataList.length === 0) {
      paintErrorMessage("Empty Content");
      setScrollMark();
      return;
    }

    if ("content" in document.createElement("template")) {
      // get content template
      const $history_row = document.querySelector("#history_row");
      const $ul = document.createElement("ul");

      // clone and crate rows
      for (let i = 0; i < dataList.length; i++) {
        const rowData = dataList[i];
        const row = document.importNode($history_row.content, true);

        //set btn data
        const tabTitle = row.querySelector(".tabTitle");
        tabTitle.value = rowData.tabTitle;
        tabTitle.dataset.uid = rowData.uid;

        const tooltip = row.querySelector(".tooltip");
        cont[url] = tooltip.querySelector("li");
        url.textContent = rowData.params.url;

        $ul.appendChild(row);
      }

      // add list
      const $content = getContentDom();
      $content.appendChild($ul);
    } else {
      paintErrorMessage("template is not support");
    }

    setScrollMark();
  };

  fillForm = (uid) => {
    chrome.runtime.sendMessage(
      { message: "GET_ROW_DATA", tabId: "HISTORY", uid },
      async (params) => {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        await chrome.tabs.sendMessage(tab.id, { message: "FILL", params });
      }
    );
  };
}

class Favorite {
  #favorite;

  constructor() {}

  setState = (data) => {
    this.#favorite = data;
    this.render(this.#favorite);
  };

  setData(data) {
    //save IDB

    // save State
    this.setState(data);
  }

  getData() {
    return this.#favorite;
  }

  like(params) {
    const { uid, tabTitle } = params;
    chrome.runtime.sendMessage({ message: "LIKE", uid, tabTitle }, () => true);
  }

  render = (dataList) => {
    // content initialize
    clearContent();

    if (!dataList || dataList.length === 0) {
      paintErrorMessage("Empty Content");
      setScrollMark();
      return;
    }

    if ("content" in document.createElement("template")) {
      // get content template
      const $favorite_row = document.querySelector("#favorite_row");
      const $ul = document.createElement("ul");

      // clone and crate rows
      for (let i = 0; i < dataList.length; i++) {
        const rowData = dataList[i];
        const row = document.importNode($favorite_row.content, true);

        //set btn data
        const tabTitle = row.querySelector(".tabTitle");
        tabTitle.value = rowData.tabTitle;
        tabTitle.dataset.uid = rowData.uid;

        const tooltip = row.querySelector(".tooltip");
        cont[url] = tooltip.querySelector("li");
        url.textContent = rowData.params.url;

        $ul.appendChild(row);
      }

      // add list
      const $content = getContentDom();
      $content.appendChild($ul);
    } else {
      paintErrorMessage("template is not support");
    }

    setScrollMark();
  };

  fillForm = (uid) => {
    chrome.runtime.sendMessage(
      { message: "GET_ROW_DATA", tabId: "FAVORITE", uid },
      async (params) => {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        await chrome.tabs.sendMessage(tab.id, { message: "FILL", params });
      }
    );
  };
}

class Settings {
  #settings;

  constructor() {
    this.#settings = {};
  }

  setState(data) {
    this.#settings = data;
    this.render(this.#settings);
  }

  setData(data) {
    //save IDB

    // save State
    this.setState(data);
  }

  getData() {
    return this.#settings;
  }

  remove = (parmas) => {
    const { uid } = params;

    chrome.runtime.sendMessage(
      { message: "DELETE", params: { uid, tabId: "SETTINGS" } },
      () => true
    );
    chrome.runtime.sendMessage({ message: "SETTINGS" }, (response) => {
      this.render(response);
    });
  };

  render = (dataList) => {
    // content initialize
    clearContent();

    // no data
    if (!dataList || dataList.length === 0) {
      paintErrorMessage("Empty Content");
      setScrollMark();
      return;
    }

    if ("content" in document.createElement("template")) {
      //get content template
      const $settings_row = document.querySelector("#settings_row");
      const $ul = document.createElement("ul");

      // clone and create rows
      for (let i = 0; i < dataList.length; i++) {
        const rowData = dataList[i];
        const row = document.importNode($settings_row.content, true);

        // set btn data
        const [getBtn] = row.querySelectorAll("button");
        getBtn.dataset.uid = rowData.uid;

        // set list data
        const [url] = row.querySelectorAll("div");
        url.textContent = rowData.params.url;

        $ul.appendChild(row);
      }

      // add list
      const $content = getContentDom();
      $content.appendChild($ul);
    } else {
      paintErrorMessage("template is not support");
    }

    setScrollMark();
  };
}

let history, favorite, settings;

const init = () => {
  history = new History();
  favorite = new Favorite();
  settings = new Settings();

  chrome.runtime.sendMessage({ message: "GET_HISTORY_STATE" }, (response) => {
    document.querySelector("#toggle_btn").checked = response;
    return true;
  });

  chrome.runtime.sendMessage({ message: "HISTORY" }, (response) => {
    history.setState(response);
    return true;
  });
};



