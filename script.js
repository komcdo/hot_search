// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Twitter Hot Search!
// @author       You
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';
    const style = document.createElement('style');
    style.textContent = `
    .hotzearch_from > .token {
        content: "From";
        position: relative;
        top: 8px;
        left: 5px;
        background: #5e5e5e;
        padding: 3px 16px 5px;
        border-radius: 13px;
        display: block;
        white-space: nowrap;
        height: 19px;
    }`;
    document.head.append(style);

    console.log("Click to debug");

    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }else{
                let elmFinder = setInterval(()=>{
                    console.log("...");
                    if (document.querySelector(selector)) {
                        clearInterval(elmFinder);
                        return resolve(document.querySelector(selector));
                    }
                }, 100)
            }
        });
    }

    const setNativeValue = (element, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

        if (valueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else {
            valueSetter.call(element, value);
        }
    }

    const enableZearch = (text) => {
        hotzearchEnabled = true;
        searchInput.parentElement.classList.add("hotzearch_from");
        zearchToken.textContent = text;
        if(!zearchToken.isConnected){
            searchInput.parentElement.prepend(zearchToken)
        }
    }
    const disableZearch = () => {
        hotzearchEnabled = false;
        searchInput.parentElement.classList.remove("hotzearch_from");
        if(zearchToken.isConnected){
            searchInput.parentElement.removeChild(zearchToken)
        }
    }
    const getSearchParts = (searchString) => {
        let showUser = searchString.indexOf(" ") > -1 ? true : false;
        if(searchString.startsWith("@")){
            hotzearchEnabled = true;
            searchString = searchString.slice(1);
        }
        if(searchString.toLowerCase().startsWith("from:")){
            hotzearchEnabled = true;
            searchString = searchString.slice(5);
        }
        if(searchString.toLowerCase().startsWith("(from:")){
            hotzearchEnabled = true;
            searchString = searchString.slice(6).replace(")", "");
        }
        if(searchString[0] == "@") searchString.replace("@", "");
        const searchSplit = searchString.split(/ (.*)/);
        return {
            user: showUser ? searchSplit[0] : "",
            searchText: showUser ? searchSplit[1] : searchSplit[0],
        }
    }
    const addTokenToSearchString = (searchString) =>{
        if(hotzearchEnabled){
            let zearchTokenText = zearchToken.textContent;
            let zearchTokenTextParts = zearchTokenText.split(" ");
            let newValue = zearchTokenTextParts[0]+":";
            newValue = zearchTokenTextParts[1] ? "(" + newValue.toLowerCase() + zearchTokenTextParts[1]+") " : newValue;
            return newValue + searchString;
        }else{
            return searchString;
        }
    }
    const processSearchString = (searchParts) => {
        let zearchTokenText = zearchToken.textContent;
        let zearchTokenTextParts = zearchTokenText.split(" ");
        const zearchTokenString = searchParts.user ? "From " + searchParts.user : "From"
        enableZearch(zearchTokenString);
        if(zearchTokenString == "From" && searchParts.searchText[0] != "@") searchParts.searchText = "@" + searchParts.searchText || "";
        setNativeValue(searchInput, searchParts.searchText || "");
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const protectUser = (cont) => {
        let protectionContent = document.createElement("div");
        protectionContent.innerHTML = '<div style="color: white;background: #460505;padding: 8px 16px 12px;text-align: center;font: 12px -apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,Helvetica,Arial,sans-serif;border-radius: 5px;margin: 0 15px;border: 1px solid red;"><div style="font-weight: 600;text-transform: uppercase;margin: 4px 0 8px;">Search blocked</div>To make Twitter more fun, our AI has detected this account is not funny and has blocked searching for this user\'s tweets.</div>'
        cont.append(protectionContent);
        return true;
    }
    const userSelectedFromList = () => {
        const typeaheadSelected = searchForm.querySelector("[data-testid='typeaheadResult'][aria-selected=true]");
        if(typeaheadSelected){
            const username = typeaheadSelected.querySelectorAll("span")[2].textContent.slice(1);
            if(username == "kathygriffin") return protectUser(typeaheadSelected);
            let combinedSearchString = addTokenToSearchString("@" + username + " ")
            let searchParts = getSearchParts(combinedSearchString);
            processSearchString(searchParts);
            return true;
        }
        return false;
    }
    const tokenizeSearch = (event) => {
        let value = event.target.value.trimStart();
        const input = event.key; // String.fromCharCode(event.keyCode);

        if(event.key == "ArrowUp" || event.key == "ArrowDown") return true; // Up/Down arrows

        let textInput = false;
        if (event.key.length == 1 && /[a-zA-Z0-9-_: ]/.test(input)) {
            textInput = true;
            value += input;
        }

        value = addTokenToSearchString(value);
        let searchParts = getSearchParts(value);

        if(hotzearchEnabled){
            if(event.key == "Backspace" && event.target.value == ""){
                let token = zearchToken.textContent;
                let tokenParts = token.split(" ");
                if(tokenParts[1]){
                    // tokenParts[1] will contain the user name.
                    // Bring the username into the input for editing
                    setNativeValue(searchInput, tokenParts[1]);
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    enableZearch("From");
                }else{
                    disableZearch();
                }
                return;
            }
            if(textInput){
                event.stopPropagation();
                event.preventDefault();
            }
            processSearchString(searchParts);
        }else{
            disableZearch();
        }

        if(event.key == "Enter" && hotzearchEnabled){
            if(userSelectedFromList()){
                event.stopPropagation();
                event.preventDefault();
                return false;
            }else{
                setNativeValue(searchInput, value);
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                setTimeout(init, 0);
            }
        }
    };


    let searchInput, searchForm, zearchToken, hotzearchEnabled;
    const init = async () => {
        searchInput = await waitForElm("[data-testid='SearchBox_Search_Input']");
        searchInput.placeholder = "Twitter Hot Search";
        searchForm = searchInput.closest("form");
        if(zearchToken && zearchToken.isConnected){
            zearchToken.remove();
        };
        zearchToken = document.createElement("span");
        zearchToken.classList.add("token");
        hotzearchEnabled = false;

        searchInput.addEventListener("keydown", tokenizeSearch);
        searchInput.addEventListener('DOMNodeRemoved', (e) => {
            if(e.target == searchInput){
                console.log("search input removed");
                init();
            }
        });
        searchForm.addEventListener("click", (event) => {
            const el = event.target.closest("[data-testid='typeaheadResult']");
            if(el){
                el.setAttribute("aria-selected", true);
                if(userSelectedFromList(el)) {
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                };
            }
        })

        let searchParts = getSearchParts(searchInput.value);
        if(hotzearchEnabled){
            processSearchString(searchParts);
        }
    }
    await init();
    console.log("Twitter Hot Search enabled");
})();
