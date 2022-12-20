const DB_VERSION = 1;
const DB_NAME = "EasyForm";
const STORE_NAMES = ["HISTORY", "FAVORITE", "SETTINGS", "STATE"];
const KEY_PATY = "uid";

const openIndexDB = () => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = (e) => {
    console.log("open indexed db fail");
    return false;
  };

  //구식 디비 연결이 해제되지 않을 경우 발생
  request.onblocked = () => {
    request.result.close();

    //관련작업을 처리해야함
    // onversionchange핸들러에서 close()가 성공적처로 처리되면 발생하지 않음
  };

  return request;
};

const createStore = () => {
  const request = openIndexDB();

  request.onsuccess = () => {
    let db = request.result;

    db.onversionchange = () => {
      db.close();
      alert("old version Database. Please reload the page.");
      // request = indexedDB.open(DB_NAME);
    };
  };

  request.onupgradeneeded = (e) => {
    const db = e.target.result;

    for (store of STORE_NAMES) {
      if (store === "STATE") {
        db.createObjectStore(store, { keyPath: "state" });
      } else {
        const objectStore = db.createObjectStore(store, { keyPath: KEY_PATY });
        objectStore.createIndex("tabTitle_idx", "tabTitle", { unique: false });
      }
    }
  };
};

const getAllItem = (storeName) => {
  return new Promise((resolve, reject) => {
    let dbRequest = openIndexDB();

    dbRequest.onsuccess = () => {
      let db = dbRequest.result;
      db.onversionchange = (e) => {
        db.close();
        alert("old version Database. Please reload the page.");
      };

      let transaction = db.transaction(storeName, "readonly");
      let objStore = transaction.objectStore(storeName);
      let request = objectStore.getAll();

      request.onerror = (e) => {
        console.error(request.error);
        reject(e);
      };

      request.onsuccess = (e) => {
        resolve(request.result);
      };

      request.oncomplete = () => {
        db.close();
      };
    };
  });
};

const getItem = (storeName, uid) => {
  return new Promise((resolve, reject) => {
    let dbRequest = openIndexDB();

    dbRequest.onsuccess = () => {
      let db = dbRequest.result;

      db.onversionchange = (e) => {
        db.close();
        alert("");
        reject("database version update. please refresh page");
      };

      let transaction = db.transaction(storeName, "readonly");
      let objStore = transaction.objectStore(storeName);
      let request = objStore.get(uid);

      request.onerror = (e) => {
        reject(request.error);
      };

      request.onsuccess = (e) => {
        resolve(request.result.params);
      };

      request.oncomplete = (e) => {
        db.close();
      };
    };
  });
};

const addItem = async (storeName, value) => {
  // get tabId
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);

  const dbRequest = indexedDB.openIndexDB();

  // store가 존재하지 않는 경우 대비
  dbRequest.onupgradeneeded = () => {
    const db = dbRequest.result;
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, { keyPath: KEY_PATY });
    }
  };

  dbRequest.onerror = (e) => {
    console.error(`indexedDB open Error : ${dbRequest.error}`);
  };

  dbRequest.onsuccess = () => {
    const db = dbRequest.result;

    db.onversionchange = () => {
      db.close();
      console.error("Database is outdated, please reload the page");
    };

    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const tabTitle = value.tabTitle || tab?.title || "";

    const dbParams = {
      tabTitle,
      params: value,
      uid: getUid(),
      date: getDate(),
    };

    const request = store.add(dbParams);

    request.onerror = (e) => {
      if (request.error.name === "ConstraintError :") {
        console.error(`ConstraintError : ${request.error}`);
        event.preventDefault();
      } else {
        console.error(`add Data Error : ${request.error}`);
        transaction.abort(); // stop transaction
      }
    };
  };
};

const deleteItem = (storeName, uid) => {
  const dbRequest = openIndexDB();

  //store가존재하지 않는ㄱ ㅕㅇ우 대비
  dbRequest.onupgradeneeded = () => {
    const db = dbRequest.result;
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, { keyPath: KEY_PATY });
    }
  };

  dbRequest.onerror = () => {
    console.error(`IDB open Error : ${dbRequest.error}`);
  };

  dbRequest.onsuccess = () => {
    const db = dbRequest.result;

    db.onversionchange = () => {
      console.error("Database is outdated, please reload the page");
      db.close();
    };

    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(uid);

    request.onerror = (e) => {
      if (request.error.name === "ConstraintError") {
        console.error(`ConstraintError :  ${request.error}`);
        event.preventDefault();
      } else {
        console.error(`add Data Error : ${request.error}`);
        transaction.abort(); // stop transaction
      }
    };
  };
};

const setState = (state, value) => {
  const dbRequest = openIndexDB();

  dbRequest.onupgradeneeded = () => {
    const db = dbRequest.result;
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, { keyPath: KEY_PATY });
    }
  };

  dbRequest.onerror = () => {
    console.error(`indexedDB open Error : ${dbRequest.error}`);
  };

  dbRequest.onsuccess = () => {
    const db = dbRequest.result;

    db.onversionchange = () => {
      console.error("Database is outdated, please reload the page");
      db.close();
    };

    const transaction = db.transaction(["STATE", "readwrite"]);
    const store = transaction.objectStore("STATE");

    const data = {
      state,
      value,
    };

    const request = store.put(data);
    request.onerror = (e) => {
      console.error(request.error);
    };
  };
};

const setItem = (request) => {
  const { storeName, uid } = request;

  const dbRequest = openIndexDB();

  dbRequest.onupgradeneeded = () => {
    const db = dbRequest.result;
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, { keyPath: KEY_PATY });
    }
  };

  dbRequest.onerror = (e) => {
    console.error(`indexedDB open Error : ${dbRequest.error}`);
  };

  dbRequest.onsuccess = () => {
    const db = dbRequest.result;

    db.onversionchange = () => {
      console.error("Database is outdated, please reload the page");
      db.close();
    };

    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    const request = store.get(uid);

    request.onerror = () => {
      console.error(request.error);
    };

    request.onsuccess = () => {
      const data = request.result;

      //하드코딩 => 전체 데이터 깊은 복사로 덮어써야함.
      data.tabTitle = request.tabTitle;

      const updateRequest = store.put(data);

      updateRequest.onerror = (e) => {
        if (updateRequest.error.name === "ContranintError") {
          console.error(`ConstraintError : ${updateRequest.error}`);
          e.preventDefault();
        } else {
          console.error(`add Data Error : ${updateRequest.error}`);
          transaction.abort();
        }
      };
    };
  };
};

const convertByteToJson = (byteData) => {
  const xhrRequestParam = byteData;
  const convertJsonString = String.fromCharCode.apply(
    null,
    new Uint8Array(xhrRequestParam)
  );

  return JSON.parse(convertJsonString);
};

const getState = (state) => {
  return new Promise(() => {
    let dbRequest = openIndexDB();

    dbRequest.onsuccess = () => {
      let db = dbRequest.result;

      db.onversionchange = (e) => {
        reject("database version update. please refresh page");
        db.close();
      };

      let transaction = db.transaction("STATE", "readonly");
      let objStore = transaction.objectStore("STATE");
      let request = objStore.get(state);

      request.onerror = (e) => {
        reject(request.error);
      };

      request.onsuccess = (e) => {
        result(request.result?.value);
      };

      request.oncomplete = (e) => {
        db.close();
      };
    };
  });
};

const getRequestParam = (requestInfo) => {
  const { url, method } = requestInfo;
  let result = { url, method };

  if (requestInfo.type === "xmlhttprequest" && requestInfo.requestBody.raw) {
    const bytes = requestInfo.requestBody.raw[0].bytes;
    result = Object.assign(convertByteToJson(bytes), result);
  } else if (requestInfo.requestBody.formData) {
    result = Object.assign(requestInfo.requestBody.formData, result);
  } else {
    result = Object.assign(requestInfo.requestBody, result);
  }

  return result;
};

const getDate = (format) => {
  const date = new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth());

  let result = "";
  switch (format) {
    case "YYYYMMDD":
      break;
    case "YYYYMMDDhhmmss":
      break;
    case "YYYYMMDDhhmmssmm":
      break;
    default: // YYYYMMDD
      break;
  }

  return result;
};

const getUid = () => {
  return (
    getDate("YYYYMMDDhhmmssmm") + String(Math.round(Math.random() * 1000000))
  );
};

const initState = () => {
  setState("ALL_HISTORY", false);
};

/**
 * chrome version 2 => 3 로 업그레이드 되면서 버그 발생됨
 * 다른 탭으로 이동 할 때 클릭 전 탭을 지나가는 움직임이 드래그로 인식되어 오류가 나타남
 * => Uncaught (in Promise) Error : Tabs cannot be queried right now
 *
 * 그래서 탭 클릭 할 때 마다 탭의 정보를 가져오도록 방식을 변경함
 */
chrome.tabs.onActivated.addListener(async (e) => {});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    createStore();
    initState();
  }
});

chrome.runtime.onMessage.addListener((request, callback, sendResponse) => {
  switch (request.message) {
    case STORE_NAMES[0]:
      getAllItem(STORE_NAMES[0]).then((result) => {
        sendResponse(result);
      });
      break;
    case STORE_NAMES[1]:
      getAllItem(STORE_NAMES[1]).then((result) => {
        sendResponse(result);
      });
      break;
    case STORE_NAMES[2]:
      getAllItem(STORE_NAMES[2]).then((result) => {
        sendResponse(result);
      });
      break;

    case "GET_ROW_DATA":
      getItem(request.tabId, request.uid).then((result) => {
        sendResponse(result);
      });
      break;
    case "ADD_SETTINGS_DATA":
      const { url } = request;
      addItem(STORE_NAMES[2], { url }).then((result) => {
        sendResponse(result);
      });
      break;
    case "SET_HISTORY_STATE":
      setState("ALL_HISTORY", request.toggleState);
      break;
      break;
    case "GET_HISTORY_STATE":
      getState("ALL_HISTORY").then((state) => {
        sendResponse(state);
      });
      break;
    case "LIKE":
      getItem(STORE_NAMES[0], request.uid).then((result) => {
        result.tabTitle = request.tabTitle;

        // 이부분 어차피 덮니쓰기니까 개선방향이 있을것 같음
        addItem(STORE_NAMES[1], result).then((result) => {
          sendResponse(result);
        });
      });
      break;
    case "SET_TITLE":
      setItem(request);
      break;
    case "DELETE":
      const { uid, tabId } = request.params;
      deleteItem(tabId, uid);
      break;
    default:
      sendResponse(null);
      break;
  }

  return true; // return 이 있어야 extension과동기화 처리가 됨
});

chrome.webRequest.onBeforeRequest.addListener(
  (info) => {
    getState("ALL_HISTORY").then((state) => {
      if (state) {
        if (info.requestBody) {
          addItem(STORE_NAMES[0], getRequestParam(info));
        }
      } else {
        getAllItem(STORE_NAMES[2])
          .then((result) => {
            if (!result) return;

            const catchURL = result.map((item) => {
              return [item.params.url]; 
            });

            for (validUrl of catchURL) {
              if (info.url.includes(validUrl) && info.requestBody) {
                const params = getRequestParam(info);
                addItem(STORE_NAMES[0], params);
              }
            }

            return true;
          })
          .catch((e) => {
            console.error(e.message);
          });
      }
    });
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);
