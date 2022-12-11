// ==UserScript==
// @name         Twitter Hot Search
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Twitter Hot Search
// @author       komcdo
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';
    let tokenAnimationSpeed = ".3s .3s"; // speed, delay
    const style = document.createElement('style');
    style.textContent = `
        .hotzearch {font-family: TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; transition: transform ${tokenAnimationSpeed}; will-change: transform;}
        .hotzearch.noDelayAnim {transition: transform 0.3s;}
        .hotzearch .inlineToken { position: relative; top: 8px; left: 5px; background: #5e5e5e; padding: 3px 16px 5px; border-radius: 13px; display: block; white-space: nowrap; height: 19px; display: none; max-width: 100%; transition: width ${tokenAnimationSpeed}, padding ${tokenAnimationSpeed}; will-change: width, padding;}
        .hotzearch .inlineToken::first-letter { text-transform:capitalize; }
        .hotzearch .inlineToken.invisible {opacity: 0}
        .hotzearch .inlineToken.minSize.creating {width: 0px !important; padding: 3px 0 5px;}
        .hotzearch .inlineToken.minSize.deleting {width: 0px !important; padding: 3px 0 5px;}
        .hotzearch .hotzearch_inline .inlineToken {display: block;}
        .hotzearch .staticToken { white-space: nowrap; position: relative; float: left; color: white; background: #5d5d5d; font-size: 14px; padding: 8px 16px; line-height: 10px; border-radius: 16px; cursor: pointer; margin:0 8px 8px 0; opacity: 1; transition: width ${tokenAnimationSpeed}, height ${tokenAnimationSpeed}, margin ${tokenAnimationSpeed}; will-change: width, height, margin-top;}
        .hotzearch .staticToken::first-letter { text-transform:capitalize; }
        .hotzearch .staticToken .staticTokenRemove{ height: 16px; width: 16px; position: absolute; right: 2px; top: 2px; background: #cfcfcf; border-radius: 50%; padding: 3px 0px 3px 6px; line-height: 10px; color: black; opacity: 0;}
        .hotzearch .staticToken:hover .staticTokenRemove {opacity: 1;}
        .hotzearch .staticToken.invisible {opacity: 0}
        .hotzearch .cloneToken {display: block; position: absolute; z-index: 1; transition: transform ${tokenAnimationSpeed}, font-size ${tokenAnimationSpeed}, padding ${tokenAnimationSpeed}, line-height ${tokenAnimationSpeed}, height ${tokenAnimationSpeed}; will-change: transform, font-size, padding, line-height, height;}
        .hotzearch .zearchTokenWrap {position: relative; height: 0; padding-bottom: 4px; margin-top: -4px; transition: margin-top ${tokenAnimationSpeed}, height ${tokenAnimationSpeed}; will-change: margin-top, height;}
        .hotzearch .zearchTokenWrap.noDelayAnim {transition: margin-top .3s, height .3s; }
        .hotzearch .filterButton { position: relative; top: 7px; margin-right: 5px; height: 20px; width: 20px; color: #999da1; border-radius: 13px; padding: 4px 6px; display: block; white-space: nowrap; cursor: pointer;}
        .hotzearch .filterDialog { position: absolute; top: 41px; right: -7px; background: #36393f; padding-right: 8px; border-radius: 16px;}
        .hotzearch .filterDialog select{ background: #4a4c52; border: none; font-size: 15px; border-top-left-radius: 16px; border-bottom-left-radius: 16px; padding: 5px 0px 5px 15px; color: white;}
        .hotzearch .filterDialog input{ background: none; border: none; padding: 6px 0 6px 6px; font-size: 15px; outline: none; width: 200px; color: white }
        .hotzearch.noAnim {transition: none !important;}
        .hotzearch.noAnim .inlineToken{transition: none;}
        .hotzearch.noAnim .staticToken{transition: none;}
        .hotzearch.noAnim .zearchTokenWrap{transition: none !important;}
        @media (prefers-color-scheme: light) {
            .hotzearch .filterDialog select,
            .hotzearch .staticToken,
            .hotzearch .cloneToken,
            .hotzearch .hotzearch_inline .inlineToken { background: #1d9bf0; color: white; }
            .hotzearch .filterDialog { background: #e6e6e6; }
            .hotzearch .staticToken .staticTokenRemove{ background: #fafafa; }
            .hotzearch .filterDialog input{ color:black;}
            .hotzearch .filterDialog select{ color:black;}
        }`;
    document.head.append(style);
    const closeBtn = `<svg viewBox="0 0 15 15" width="10px" height="10px" aria-hidden="true" class="r-cqee49 r-4qtqp9 r-yyyyoo r-1or9b2r r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-5soawk"><g><path d="M6.09 7.5L.04 1.46 1.46.04 7.5 6.09 13.54.04l1.42 1.42L8.91 7.5l6.05 6.04-1.42 1.42L7.5 8.91l-6.04 6.05-1.42-1.42L6.09 7.5z"></path></g></svg>`;
    const filterBtn = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="bi bi-funnel" viewBox="0 0 16 16"><path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"></path></svg>`;

    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) return resolve(document.querySelector(selector));
            let elmFinder = setInterval(()=>{
                if (document.querySelector(selector)) {
                    clearInterval(elmFinder);
                    return resolve(document.querySelector(selector));
                }
            }, 50);
        });
    }

    const setNativeValue = (element, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        if (valueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else {
            valueSetter.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const refreshInlineToken = (newInlineContent) => {
        if(newInlineContent) inlineContent = {...inlineContent, ...newInlineContent};
        if(!inlineContent.method) return removeInlineToken();
        inlineTokenExists = true;
        let text = inlineContent.method;
        if(inlineContent.value) {
            text += " " + inlineContent.value.trim().replace(/,/g, " or ").trim();
        }
        searchInput.parentElement.classList.add("hotzearch_inline");
        inlineToken.textContent = text;
    }

    const removeInlineToken = () => {
        inlineTokenExists = false;
        searchInput.parentElement.classList.remove("hotzearch_inline");
    }

    const createStaticToken = (method, value, addColon, preventAnim) => {
        let allowAnim = !preventAnim && inited;
        let newTokenId = (Math.random() + 1).toString(36).substring(7);
        let newToken = document.createElement("div");
        newToken.classList.add("staticToken");
        allowAnim && newToken.classList.add("invisible");
        newToken.addEventListener("click", removeStaticToken);
        newToken.setAttribute("data-id", newTokenId);
        let removeButton = "<div class='staticTokenRemove'>"+closeBtn+"</div>";
        staticTokens.push({
            method,
            value,
            id: newTokenId,
            elem : newToken,
            status: "active"
        });
        addColon && (method += ":");
        newToken.innerHTML = method +" "+ value + removeButton;
        staticTokenWrap.append(newToken);
        animateStaticTokenChange(newToken, "push", allowAnim)
    }

    const removeStaticToken = (event) => {
        let tokenId = event.target.closest(".staticToken").getAttribute("data-id");
        let staticTokenObj = staticTokens.find(token => token.id === tokenId);
        if(staticTokenObj && staticTokenObj.elem) {
            if(!event.target.closest(".staticTokenRemove")){
                // Close button wasn't clicked, so the token body was clicked -> Edit token
                refreshInlineToken({method: staticTokenObj.method, value: null, spaceAfterValue: null, searchString: staticTokenObj.value.trim()});
                setNativeValue(searchInput, staticTokenObj.value.trim());
                searchInput.focus();
            }
            animateStaticTokenChange(staticTokenObj.elem, "pull", false);
            staticTokenObj.elem.remove();
            staticTokenObj.status = "removed";
        }
    }

    const animateStaticTokenChange = (staticToken, direction, allowAnim) => {
        !allowAnim && primaryColumn.classList.add("noAnim");
        let src, target
        if(direction == "push") [src, target] = [inlineToken, staticToken];
        if(direction == "pull") [src, target] = [staticToken, inlineToken];
        const wrapRect = staticTokenWrap.getBoundingClientRect();
        const srcRect = src.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const compSrc = getComputedStyle(src);
        const compTarget = getComputedStyle(target);
        let clone = src.cloneNode(true);
        clone.classList.add("cloneToken");
        clone.style = `top: ${srcRect.top - wrapRect.top}px;
            left: ${srcRect.left - wrapRect.left}px;
            font-size: ${getComputedStyle(src).fontSize};
            padding: ${getComputedStyle(src).padding};
            line-height: ${getComputedStyle(src).lineHeight};
            height: ${getComputedStyle(src).height};`;
        allowAnim && direction == "push" && staticTokenWrap.append(clone); //Pull animation needs work
        src.setAttribute("style", `width: ${srcRect.width}px`);
        setTimeout(() => {src.classList.add("minSize", "invisible", "deleting")}, 0);
        target.classList.remove("minSize");
        clone.style = `top: ${srcRect.top - wrapRect.top}px;
            left: ${srcRect.left - wrapRect.left}px;
            transform: translate(${targetRect.left - srcRect.left}px, ${targetRect.top - srcRect.top}px);
            font-size: ${getComputedStyle(target).fontSize};
            padding: ${getComputedStyle(target).padding};
            line-height: ${getComputedStyle(target).lineHeight};
            height: ${getComputedStyle(target).height};`;
        if((direction == "push" && targetRect.left - wrapRect.left == 0) ||
           (direction == "pull" && srcRect.left - wrapRect.left == 0)){
            let lineWidth = staticTokenWrap.clientWidth, thisLineWidth = 0, lineCount = 0;
            staticTokenWrap.childNodes.forEach(token => {
                if(token == src || token == clone) return;
                if(thisLineWidth == 0 || thisLineWidth + token.clientWidth > lineWidth){
                    lineCount++;
                    thisLineWidth = token.clientWidth + 8;
                }else{
                    thisLineWidth += token.clientWidth + 8;
                }
            })
            staticLineCount = lineCount;
            if(direction == "pull") {
                primaryColumn.classList.add("noDelayAnim");
                staticTokenWrap.classList.add("noDelayAnim");
            }
            let setTopHeight = () => {
                let wrapHeight = staticLineCount * 34;
                staticTokenWrap.style = `margin-top: ${0 - wrapHeight - 4}px; height: ${wrapHeight}px`;
                primaryColumn.style.transform = "translateY("+(wrapHeight + 10)+"px)";
            }
            allowAnim && setTimeout(setTopHeight, 0);
            !allowAnim && setTopHeight();
        }
        let animationTime = allowAnim && direction == "push" ? 600 : 0;
        setTimeout(() => {
            !allowAnim && primaryColumn.classList.remove("noAnim");
            target.classList.remove("invisible", "creating");
            clone.remove();
            if(direction == "pull") src.remove(); // Remove staticToken
            if(direction == "push"){
                inlineContent = {...inlineContent, method: null, value: null, spaceAfterValue: null}
                refreshInlineToken();
            }
            src.style.width = null;
            src.classList.remove("invisible", "minSize", "deleting");
            staticTokenWrap.classList.remove("noDelayAnim");
        }, animationTime);
    }

    const getInlineTokenAsText = () => {
        if(!inlineContent.method) return "";
        if(!inlineContent.value) return inlineContent.method + ":";
        return inlineContent.method + ":" +inlineContent.value + " ";
    }

    const methods = {
        spaceIsEnter: ["from","to","lang","mentions","faves","replies","retweets","min_faves","min_replies","min_retweets"],
        anyFillIsEnter: ["until","since","before","after"],
        requireEnter: ["all","any","exact","none"],
    }
    methods.all = [...methods.spaceIsEnter, ...methods.anyFillIsEnter, ...methods.requireEnter];
    methods.regex = methods.all.join("|");

    const checkForParensText = (searchString) => {
        // Find text filter (any, all, exact, none) in search string:
        let fullMatch, match, method, value;
        let regex = /\((.*?)\) ?/g;
        while ((match = regex.exec(searchString)) != null) {
            [fullMatch, value] = match;
            method = "all"; // Default unless overridden
            if(value.indexOf(" OR ") > -1) [method, value] = ["any", value.replace(/ OR /g, " ")]
            if(value.indexOf("-") > -1) [method, value] = ["none", value.replace(/-/g, "")]
            if(value.startsWith("@")) [method, value] = ["mentions", value.replace(/ OR /g, " ")]
            if(value.startsWith("\"") && value.endsWith("\"")) [method, value] = ["exact", value.replace(/\"/g, "")]
            inited && refreshInlineToken({method, value});
            createStaticToken(method, value, true);
        }
        return searchString.replace(regex, "");
    }

    const processSearchString = (origString) => {
        // LTC4: Regex match the search string to pull out tokens. This matches either the full search string on page load
        // or the input from a keydown event.
        // Test regex at: https://regex101.com/r/MuEJ59/1
        let regex = new RegExp("\\(?("+methods.regex+")(?:: ?)(.+?)?\\)?($|(?<![ ,]|or) (?![,]|or))((?:.*?(?=[ (]?(?:"+methods.regex+"):))|(?:.*)?)?", "gi");
        let match, fullMatch, method, value, spaceAfterValue, searchString = origString;
        const stringToMatch = inlineContent.method ? getInlineTokenAsText() + origString : origString;
        while ((match = regex.exec(stringToMatch)) != null) {
            [fullMatch, method, value, spaceAfterValue, searchString] = match;
            [method, value, spaceAfterValue, searchString] = [method || "", value || "", spaceAfterValue || "", searchString || ""];
            method = method.toLowerCase();
            if(methods.requireEnter.includes(method)) [searchString, value, spaceAfterValue] = [value + spaceAfterValue + searchString, "", ""];
            if(value && value.trim()){
                value = value.replace(/ OR /g, " or ").replace(method + ":", ""); // Transform (from:u1 OR from:u2) -> (from:u1 or u2)
                if(searchString || spaceAfterValue == " "){
                    if(!value.trim().endsWith(" or") && !value.trim().endsWith(",")){
                        // Inline token is complete, and we can set it to be static
                        if(["before", "after", "since", "until"].includes(method)) searchInput.type = "text";
                        if(["min_faves","min_replies","min_retweets"].includes(method)) method = method.replace("min_", "");
                        inited && refreshInlineToken({method, value, spaceAfterValue, searchString});
                        // LTC5: A token was found, push it to a static token
                        createStaticToken(method, value);
                        [method, value, spaceAfterValue, searchString] = [null, null, null, searchString || ""];
                    }
                    searchString = checkForParensText(searchString);
                }else{
                    // Inline token not complete, set value as the editable search string
                    let valueParts = /(.*[ ,])(.*)$|(.*)/g.exec(value);
                    value = valueParts[1];
                    searchString = valueParts[2] || valueParts[3];
                }
            }
        }
        // LTC6: Methods like any, all, exact and none don't have a method prefix. Find these matches with separate regex.
        searchString = checkForParensText(searchString || "");
        inlineContent = {method, value, spaceAfterValue, searchString};
        if(method){
            // LTC7: After all full token matches, a "method" still remains so show the inline token
            refreshInlineToken();
            if(["from", "to", "mentions"].includes(method) && searchString[0] != "@")
                searchString = "@" + searchString;
        }
        // LTC8: After all static and inline tokens, set any remaining text to be editable.
        setNativeValue(searchInput, searchString);
    }

    const protectUser = (cont) => {
        let protectionContent = document.createElement("div");
        protectionContent.innerHTML = '<div style="color: white;background: #460505;padding: 8px 16px 12px;text-align: center;font: 12px -apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,Helvetica,Arial,sans-serif;border-radius: 5px;margin: 0 15px;border: 1px solid red;"><div style="font-weight: 600;text-transform: uppercase;margin: 4px 0 8px;">Search blocked</div>To make Twitter more fun, our AI has detected this account is not funny and has blocked searching for this user\'s tweets.</div>'
        cont.append(protectionContent);
        return true;
    }

    const userSelectedFromList = () => {
        const typeaheadSelected = searchForm.querySelector("[data-testid='typeaheadResult'][aria-selected=true]");
        if(!typeaheadSelected) return false;
        const username = typeaheadSelected.querySelectorAll("span")[2].textContent.slice(1);
        if(username == "kathygriffin") return protectUser(typeaheadSelected);
        processSearchString("@" + username + " ");
        return true;
    }

    let selectOptions = "";
    methods.all.filter(x => !["after", "before", "until", "since", "min_faves", "min_replies", "min_retweets"].includes(x)).forEach(method => {
        selectOptions+=`<option value="${method}">${method.charAt(0).toUpperCase() + method.slice(1)}</option>`;
    })
    const filterDialog = `<div class="filterDialog">
        <select>${selectOptions}</select>
        <input type="text" placeholder="Search Filter"/>
    </div>`;
    let filterDialogShown = false;
    const showFilterDialog = () => {
        event.preventDefault();
        event.stopPropagation();
        if(!filterDialogShown){
            filterDialogShown = true;
            filterButton.innerHTML = filterBtn + filterDialog; // Can't hide/show with a class because on search submit Twitter will select this input
            filterButton.querySelector("input").addEventListener("keydown", e => e.key == "Enter" && submitFilterDialog());
        }
    }
    const hideFilterDialog = () => {
        filterDialogShown = false;
        filterButton.innerHTML = filterBtn;
    }
    const submitFilterDialog = () => {
        let [select, input] = [filterButton.querySelector("select"), filterButton.querySelector("input")];
        let includeColon = methods.requireEnter.includes(select.value) ? true : false;
        createStaticToken(select.value, input.value, includeColon, true);
        hideFilterDialog();
        select.value = "from";
        input.value = "";
        setTimeout(()=>searchInput.focus(), 0);
    }

    const tokenizeSearch = (event) => {
        // LTC2: On key down, evaluate the entry
        if(event.key == "ArrowUp" || event.key == "ArrowDown") return true; // Up/Down arrows

        let value = event.target.value.trimStart();

        if(event.key == "Backspace" && event.target.value == ""){
            if(inlineContent.value){
                setNativeValue(searchInput, inlineContent.value);
                inlineContent.value = null
            }else{
                inlineContent.method = null;
            }
            refreshInlineToken();
            return;
        }
        if(event.key == "Enter" && (inlineTokenExists || staticTokens.length)){
            if(userSelectedFromList()){
                // Enter was pressed to select a user from the typeahead list
                event.stopPropagation()
                event.preventDefault();
                return false;
            }
            if(methods.requireEnter.includes(inlineContent.method)){
                refreshInlineToken({...inlineContent, value: inlineContent.searchString, spaceAfterValue: "", searchString: ""});
                createStaticToken(inlineContent.method, inlineContent.value, true);
                setNativeValue(searchInput, "");
                return false;
            }
            // Reconstruct full query, and submit
            let prepend = "";
            staticTokens.forEach((token) => {
                if(token.status == "active") {
                    let {method, value} = token;
                    if(method == "any") [method, value] = [null, value.replace(/ +/g, " OR ")];
                    if(method == "all") [method, value] = [null, value];
                    if(method == "exact") [method, value] = [null, "\"" + value + "\""];
                    if(method == "none") [method, value] = [null, value.replace(/(^| +)/g, "$1-")];
                    if(method == "mentions") [method, value] = [null, value.replace(/ *, *| +or +/g, " OR ")];
                    if(["faves", "replies", "retweets"].includes(method)) method = "min_"+method;
                    if(["from", "to", "mentions"].includes(method)) value = value.replace(/ *, *| +or +/g, " OR " + token.method +":");
                    method = method ? method + ":" : "";
                    prepend = prepend + "("+method+value+") ";
                }
            });
            prepend += getInlineTokenAsText();
            setNativeValue(searchInput, prepend + value);
            return true;
        }
        if(event.key == " " && value.endsWith("@")) return false;
        if (event.key.length == 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            // LTC3: Add key entry to value
            event.stopPropagation();
            event.preventDefault();
            if(searchInput.selectionStart != value.length) value = value.trimLeft(); // Remove trailing spaces that were not just entered
            let newInput = event.key;
            if(event.key == "," && value.startsWith("@")) newInput = " or @";
            value = value.slice(0, searchInput.selectionStart) + newInput + value.slice(searchInput.selectionEnd);
            processSearchString(value);
            searchInput.type != "date" && (searchInput.selectionStart += newInput.length);
        }
    };

    let inited, searchInput, searchForm, primaryColumn, inlineToken, inlineContent, staticTokens, staticTokenWrap, staticLineCount, inlineTokenExists, filterButton;
    const init = async () => {
        // LTC1: Find and create page elements, add event listers
        inited = false;
        searchInput = await waitForElm("[data-testid='SearchBox_Search_Input']");
        searchInput.placeholder = "Twitter Hot Search";
        searchForm = searchInput.closest("form");
        primaryColumn = searchForm.closest("[data-testid='primaryColumn'] > div") || searchForm.closest("[data-testid='sidebarColumn'] > div") ;
        primaryColumn.classList.add("hotzearch", "initing", "noAnim");
        if(inlineToken && inlineToken.isConnected) inlineToken.remove();
        inlineToken = document.createElement("div")
        inlineToken.classList.add("inlineToken");
        searchInput.parentElement.prepend(inlineToken);
        if(staticTokenWrap && staticTokenWrap.isConnected) staticTokenWrap.remove();
        staticTokenWrap = document.createElement("div")
        staticTokenWrap.classList.add("zearchTokenWrap");
        searchForm.parentElement.prepend(staticTokenWrap);
        searchForm.querySelector('* > div').style.zIndex = 1;
        staticTokenWrap.innerHTML = "";
        staticTokens = [];
        staticLineCount = 0;
        inlineContent = {};
        inlineTokenExists = false;
        if(filterButton && filterButton.isConnected) filterButton.remove();
        filterDialogShown = false;
        filterButton = document.createElement("div");
        filterButton.classList.add("filterButton");
        filterButton.innerHTML = filterBtn;
        searchInput.parentElement.append(filterButton);

        filterButton.addEventListener("click", showFilterDialog);
        document.addEventListener("click", hideFilterDialog);
        searchInput.addEventListener("keydown", tokenizeSearch);
        let lastValue = "";
        searchInput.addEventListener("input", (e) => {
            if(lastValue == searchInput.value) return true;
            lastValue = searchInput.value;
            if(["before", "after", "since", "until"].includes(inlineContent.method)){
                if(searchInput.type == "date" && searchInput.value.indexOf('m') == -1){
                    processSearchString(searchInput.value + " ");
                    searchInput.type = "text";
                    lastValue = "";
                }else{
                    searchInput.type = "date";
                    searchInput.showPicker();
                }
            }else{
                searchInput.type = "text";
            }
        });
        searchForm.addEventListener("click", (event) => {
            const el = event.target.closest("[data-testid='typeaheadResult']");
            if(el){
                el.setAttribute("aria-selected", true);
                if(userSelectedFromList(el)) {
                    return event.stopPropagation() && event.preventDefault() && false;
                };
            }
        })
        searchInput.addEventListener('DOMNodeRemoved', (e) => e.target == searchInput && init());

        // LTC9: On page load, tokenize the query
        processSearchString(searchInput.value);// Evalute searchInput.value on page load
        primaryColumn.classList.remove("initing", "noAnim");
        inited = true;
    }

    await init();

    let previousLoc = {...location};
    let observer = new MutationObserver(function(mutations) {
        if (location.href !== previousLoc.href) {
            previousLoc = {...location};
            init();
        }
    });
    const config = {subtree: true, childList: true};
    observer.observe(document, config);

    console.log("Twitter Hot Search enabled");
})();