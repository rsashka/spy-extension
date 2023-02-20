import { SearchParamKey } from "../consts";
import { writeLog } from "./shared-utils";

if (typeof window !== "undefined") {
  throw new Error("Cannot use this in page");
}
export async function openStealthTab() {
  writeLog("Attempting to open stealth tab");

  const tabs = await chrome.tabs.query({
    active: false,
    pinned: false,
    audible: false,
    status: "complete",
  });

  // TODO Check for existing stealth tab

  const eligibleTabs = tabs.filter((tab) => {
    // Must have url and id
    if (!tab.id || !tab.url) {
      return false;
    }

    if (new URL(tab.url).protocol === "chrome-extension:") {
      return false;
    }

    return true;
  });

  const [eligibleTab, ..._] = eligibleTabs;

  if (eligibleTab) {
    console.log({ eligibleTab });
    await writeLog("Found eligible tab host for stealth tab");

    const searchParams = new URLSearchParams({
      [SearchParamKey.RETURN_URL]: eligibleTab.url as string,
      [SearchParamKey.FAVICON_URL]: eligibleTab.favIconUrl || "",
      [SearchParamKey.TITLE]: eligibleTab.title || "",
    });

    const url = `${chrome.runtime.getURL(
      "/stealth-tab.html"
    )}?${searchParams.toString()}`;

    await chrome.tabs.update(eligibleTab.id as number, {
      url,
      active: false,
    });

    await writeLog("Initialized stealth tab");
  } else {
    await writeLog("No eligible tab host for stealth tab");
  }
}

export async function sendTabBack(sender: chrome.runtime.MessageSender) {
  console.log({ sender });

  if (!sender.url) {
    console.error("Bad sender url");
    return;
  }

  const returnUrl = new URL(sender.url).searchParams.get(
    SearchParamKey.RETURN_URL
  );

  if (!returnUrl) {
    console.error("Cannot get return url");
    return;
  }

  return chrome.tabs.update({
    url: returnUrl,
    active: false,
  });
}