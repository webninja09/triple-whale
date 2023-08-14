// HELPER FUNCTIONS START----
const getElem = (attributeValue) =>
  document.querySelector(`[fd-custom-code="${attributeValue}"]`);

function formatWords(arr) {
  const wordsArr = [...arr];
  if (wordsArr.length === 0) {
    return "";
  } else if (wordsArr.length === 1) {
    return wordsArr[0];
  } else {
    var lastWord = wordsArr.pop();
    return wordsArr.join(", ") + " and " + lastWord;
  }
}

const hide = (el) => (el.style.display = "none");
const showElementGrid = (el) => (el.style.display = "grid");

// this button refers to the last generate Content button what was clicked.
// The clicking of this button either opens the form or generates a response
let lastClickedButton;

const setTriggerButtonAttribute = (btn) =>
  btn.setAttribute("fs-formsubmit-element", "ix-trigger");

const removeTriggerAttribute = (btn) =>
  btn.removeAttribute("fs-formsubmit-element");
// getting all the generate responses button -

const gptResponseNode = getElem("gpt-response-text");

// this function checks if all the required fields have been filled or not.
const shouldGeneratePrompt = (inputObj) => {
  let generatePrompt = true;
  for (const el of Object.values(inputObj)) {
    if (el.required && !el.value) {
      generatePrompt = false;
      break;
    }
  }
  return generatePrompt;
};

const addFullStop = (text) => {
  // Trim any trailing whitespace
  text = text.trim();

  // Check if the last character is a full stop
  if (text[text.length - 1] !== ".") {
    // Add a full stop at the end
    text += ".";
  }

  return text;
};

// this function displays the element as grid and scrolls the DOM to view that element
const showAndScrollToElement = (el) => {
  showElementGrid(el);
  // el.scrollIntoView({
  //   behaviour: "smooth"
  // });
  window.scrollBy(0, 400);
};

const getPrompt = (prompts, inputValues) => {
  let promptText = "";
  Object.entries(prompts).forEach((el) => {
    // using array destructuing here; the second element received is actually the value of the "prompts" object;
    // since this value is a function that actually generates a prompt text, i renamed it promptGeneratorForInput
    const [key, promptGeneratorForInput] = el;

    // the the user has entered input for that property,
    // we generate a prompt text based on it
    if (inputValues[key].value) {
      const text = promptGeneratorForInput(inputValues[key].value);
      promptText = promptText.concat(text);
    }
  });

  return promptText;
};
const formPopup = getElem("gpt-form-wrapper");
formPopup.style.display = "none";

const getCookieExpirationDate = () => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 2);
  return expirationDate.toUTCString();
};
const saveTodayInCookie = () => {
  const today = new Date();
  document.cookie = `tw-popup=${today.toUTCString()}; expires=${getCookieExpirationDate()}; path=/`;
};

const hasAlreadySubmittedForm = () => {
  const lastPopupCloseDate = document.cookie
    .split(";")
    .find((cookie) => cookie.trim().startsWith("tw-popup="));
  if (!lastPopupCloseDate) {
    return false;
  }

  const lastClosedDate = new Date(lastPopupCloseDate.split("=")[1]);
  const currentDate = new Date();
  const differenceInMilliseconds = currentDate - lastClosedDate;
  const DAYS = 10;
  const twoDaysInMilliseconds = DAYS * 24 * 60 * 60 * 1000; // 2 days in milliseconds
  // const twoDaysInMilliseconds = DAYS * 60 * 1000; // 1 min in milliseconds

  return differenceInMilliseconds <= twoDaysInMilliseconds;
};

const onSuccessSubmission = () => {
  saveTodayInCookie();
  formPopup.style.display = "none";

  // now we need to progratimatically click the button on whose click this form was opened;
  if (lastClickedButton) {
    lastClickedButton.click();
  }
};

const onSuccessSubmissionBtn = getElem("on-success-submit");
onSuccessSubmissionBtn.addEventListener("click", onSuccessSubmission);

// the function to make request to ChatGPT API;
//https://sea-turtle-app-uzgks.ondigitalocean.app/generate-response
//https://373szd-8080.csb.app/generate-response

const makeRequestToChatGPT = async (prompText) => {
  try {
    const API_URL = `https://sea-turtle-app-uzgks.ondigitalocean.app/generate-response`;

    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompText
      })
    });

    const data = await resp.json();
    console.log("Response from server", data);
    const { responseText } = data;

    const paragraphs = responseText.split("\n\n");

    const wrapperDiv = document.createElement("div");
    paragraphs.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      wrapperDiv.appendChild(p);
    });

    return wrapperDiv;
  } catch (error) {
    await fetch(
      "https://sea-turtle-app-uzgks.ondigitalocean.app/notify-slack",
      {
        method: "POST"
      }
    );
  }
};
const setPromptText = (textField, promptText) => {
  textField.innerText = "";
  textField.innerText = promptText;
  // set promptText on popup too;
  let field = formPopup.querySelector("[fd-custom-code='popup-prompt']");

  field.value = promptText;
};

// ending text refers to any text that is to be added to the final prompt
// that does not depend on any user inpt
const generatePrompt = (promptsTexts, finalInputs, endingText = "") => {
  const shouldProceed = shouldGeneratePrompt(finalInputs);

  if (shouldProceed) {
    let prompt = getPrompt(promptsTexts, finalInputs);
    prompt = endingText ? prompt.concat(endingText) : prompt;

    return addFullStop(prompt);
  } else {
    return "";
  }
};

// HELPER FUNCTION ENDS -------

const allResponsesButton = document.querySelectorAll(
  "[fd-custom-button='generate-response']"
);

// remove the finsweet trigger attribute
allResponsesButton.forEach(removeTriggerAttribute);

const tabSelectors = document.querySelectorAll(
  "[fd-custom-code='tab-selector']"
);
const gptResponseWrapper = getElem("prompt-wrapper");
hide(gptResponseWrapper);
tabSelectors.forEach((selector) => {
  selector.addEventListener("click", (e) => {
    allResponsesButton.forEach(removeTriggerAttribute);
    hide(gptResponseWrapper);
  });
});

const renderSelectedMotives = (node, selectedBuyerMotives) => {
  const parentWrapper = node.parentNode.parentNode.parentNode;
  const selectedMotivesWrapper = parentWrapper.querySelector(
    "[fd-custom-code='selected-motives']"
  );

  selectedMotivesWrapper.innerHTML = "";

  selectedBuyerMotives.forEach((motive) => {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    span.style.fontSize = "12px";
    span.style.color = "#ffffff";
    span.style.backgroundColor = "#0B3651";
    span.style.padding = "3px 8px";
    span.style.borderRadius = "8px";
    span.innerText = motive;
    selectedMotivesWrapper.appendChild(span);
  });
};

const scrollToResponseNode = () => {
  if (window.innerWidth < 992) {
    gptResponseNode.scrollIntoView();
  }
};
// the prompt logic and code starts ------------------

const SEOMetaTitle = () => {
  let selectedBuyerMotives = [];
  const promptDisplayNode = getElem("smt-prompt-text");

  // const gptResponseNode = getElem("chatgpt-response");
  const generateResponseButton = getElem("smt-generate-response");

  const promptsTexts = {
    pageType: (type) =>
      `Come up with a compelling SEO Meta title for my ecommerce ${type}.`,
    pageTitle: (title) =>
      ` The title of the page ${userInputs.pageType.value} is ${title}.`,
    maxCharacterCount: (count) => ` The meta title should be under ${count}.`,
    brandName: (name) => "",
    tone: (name) => ` The tone should be ${name}`,
    targetKeyword: (keyword) => `, and my target keyword is ${keyword}.`
  };

  const userInputs = {
    pageType: {
      value: "",
      required: true
    },
    pageTitle: {
      value: "",
      required: false
    },
    maxCharacterCount: {
      value: "",
      requred: false
    },
    brandName: {
      value: "",
      required: true
    },
    tone: {
      value: "",
      required: false
    },
    targetKeyword: {
      value: "",
      required: false
    }
  };
  const elementNodes = [
    {
      name: "pageType",
      eventType: "change",
      node: getElem("smt-page-type")
    },
    {
      name: "pageTitle",
      eventType: "input",
      node: getElem("smt-page-title")
    },
    {
      name: "maxCharacterCount",
      eventType: "input",
      node: getElem("smt-max-character")
    },
    {
      name: "brandName",
      eventType: "input",
      node: getElem("smt-brand-name")
    },
    {
      name: "tone",
      eventType: "change",
      node: getElem("smt-tone")
    },
    {
      name: "targetKeyword",
      eventType: "input",
      node: getElem("smt-target-keyword")
    }
  ];

  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;

    if (name === "buyerMotive") {
      const allOptions = node.querySelectorAll("option");
      allOptions.forEach((option) => {
        option.addEventListener("click", () => {
          selectedBuyerMotives = [...allOptions]
            .filter((option) => option.selected)
            .map((option) => option.textContent);

          renderSelectedMotives(node, selectedBuyerMotives);

          const prompt = generatePrompt(promptsTexts, userInputs);
          if (prompt) {
            setPromptText(promptDisplayNode, prompt);
          }
        });
      });
    }
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;
      const prompt = generatePrompt(promptsTexts, userInputs);
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);

    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);

        gptResponseNode.innerHTML = "Loading... Please Wait";
        const prompt = generatePrompt(promptsTexts, userInputs);
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
          gptResponseNode.appendChild(response);
        } catch (error) {
          response = "Error Occured in Generating Response";
          gptResponseNode.innerHTML = response;
        }

        scrollToResponseNode();
        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

const adCopy = () => {
  const generateResponseButton = getElem("ac-generate-response");
  let selectedBuyerMotives = [];
  const promptsTexts = {
    brandName: (name) =>
      `Help me come up with some copy for my online ad. My ecommerce brand is called ${name}`,
    brandNiche: (niche) => `, and we're in the the ${niche} space`,
    productName: (name) => ` My product is called ${name}`,
    // adComponent: (component) => ` The copy is for ${component}`,
    adComponent: (component) => ``,
    adType: (type) => `. It should be a ${type}`,
    keyFeatures: (features) =>
      `. The key features I’d like to callout are ${features}`,
    keyBenefits: (benefits) =>
      `, and the key benefits I’d like to callout are ${benefits}`,
    desiredTone: (tone) => `. The tone should be ${tone}`,
    buyerMotive: () =>
      `, and the ad should appeal to the ${formatWords(
        selectedBuyerMotives
      )} buyer motive`,
    offer: (offer) => `. The offer is a ${offer} offer`,
    desiredWordCount: (count) => `. The ad copy shoud be around ${count} words.`
  };
  const promptDisplayNode = getElem("ac-prompt-text");

  const userInputs = {
    brandName: {
      value: "",
      required: true
    },
    brandNiche: {
      value: "",
      required: false
    },
    productName: {
      value: "",
      requred: false
    },
    adComponent: {
      value: "",
      required: true
    },
    adType: {
      value: "",
      required: true
    },
    keyFeatures: {
      value: "",
      required: false
    },
    keyBenefits: {
      value: "",
      required: false
    },
    desiredTone: {
      value: "",
      required: true
    },
    buyerMotive: {
      value: "",
      required: false
    },
    offer: {
      value: "",
      required: false
    },
    desiredWordCount: {
      value: "",
      required: false
    }
  };

  // document element Nodes;
  const elementNodes = [
    { name: "brandName", eventType: "input", node: getElem("ac-brand-name") },
    {
      name: "brandNiche",
      eventType: "change",
      node: getElem("ac-brand-niche")
    },
    {
      name: "productName",
      eventType: "input",
      node: getElem("ac-product-name")
    },
    {
      name: "adComponent",
      eventType: "change",
      node: getElem("ac-ad-component")
    },
    { name: "adType", eventType: "change", node: getElem("ac-ad-type") },
    {
      name: "keyFeatures",
      eventType: "input",
      node: getElem("ac-key-features")
    },
    {
      name: "keyBenefits",
      eventType: "input",
      node: getElem("ac-key-benefits")
    },
    { name: "desiredTone", eventType: "change", node: getElem("ac-tone") },
    {
      name: "buyerMotive",
      eventType: "change",
      node: getElem("ac-buyer-motive")
    },
    { name: "offer", eventType: "change", node: getElem("ac-offer") },
    {
      name: "desiredWordCount",
      eventType: "input",
      node: getElem("ac-word-count")
    }
  ];
  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;

    if (name === "buyerMotive") {
      const allOptions = node.querySelectorAll("option");
      allOptions.forEach((option) => {
        option.addEventListener("click", () => {
          selectedBuyerMotives = [...allOptions]
            .filter((option) => option.selected)
            .map((option) => option.textContent);

          renderSelectedMotives(node, selectedBuyerMotives);

          userInputs.buyerMotive.value = [...selectedBuyerMotives];
          let endingText = "";
          if (userInputs.adComponent.value === "Headline") {
            endingText = ". Generate a headline for this.";
          } else if (userInputs.adComponent.value === "Description") {
            endingText = ". Generate a description for this.";
          } else if (userInputs.adComponent.value === "Both") {
            endingText = ". Generate headline and description both for this";
          }
          console.log("user input ", userInputs);
          const prompt = generatePrompt(promptsTexts, userInputs, endingText);
          if (prompt) {
            setPromptText(promptDisplayNode, prompt);
          }
        });
      });
    }
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;
      let endingText = "";
      if (userInputs.adComponent.value === "Headline") {
        endingText = ". Generate a headline for this.";
      } else if (userInputs.adComponent.value === "Description") {
        endingText = ". Generate a description for this.";
      } else if (userInputs.adComponent.value === "Both") {
        endingText = ". Generate headline and description both for this";
      }
      console.log("user inputs ", userInputs);
      const prompt = generatePrompt(promptsTexts, userInputs, endingText);
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);
    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);
        gptResponseNode.innerHTML = "Loading... Please Wait";
        const endingText = "Generate headline and description both for this";
        const prompt = generatePrompt(promptsTexts, userInputs, endingText);
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
          gptResponseNode.appendChild(response);
        } catch (error) {
          response = "Error Occured in Generating Response";
          gptResponseNode.innerHTML = response;
        }

        scrollToResponseNode();
        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

const blogCopy = () => {
  let selectedBuyerMotives = [];
  const generateResponseButton = getElem("bc-generate-response");
  const promptDisplayNode = getElem("bc-prompt-text");
  const promptsTexts = {
    brandName: (name) => ``,
    blogTitle: (title) =>
      `I need help writing a section of a blog post. The title of the blog post is ${title}`,
    sectionHeader: (header) =>
      `, and the title of the section header is ${header}`,
    targetKeyword: (keyword) => `. The keyword I’m targeting is ${keyword}`,
    secondaryKeywords: (keywords) =>
      `. The secondary keywords I am targeting are ${keywords}`,
    tone: (tone) => `. The tone of the post should be ${tone}`,
    wordCount: (count) => `. The word count should be around ${count} words`,
    numOfExamples: (num) => `, and I’d like to cite at least ${num} examples.`
  };
  const userInputs = {
    brandName: {
      value: "",
      required: false
    },
    blogTitle: {
      value: "",
      required: true
    },
    targetKeyword: {
      value: "",
      required: false
    },
    secondaryKeywords: {
      value: "",
      required: false
    },
    sectionHeader: {
      value: "",
      required: true
    },
    tone: {
      value: "",
      required: false
    },
    numOfExamples: {
      value: "",
      required: false
    },
    wordCount: {
      value: "",
      required: false
    }
  };
  const elementNodes = [
    {
      name: "brandName",
      eventType: "input",
      node: getElem("bc-brand-name")
    },
    {
      name: "blogTitle",
      eventType: "input",
      node: getElem("bc-blog-title")
    },
    {
      name: "targetKeyword",
      eventType: "input",
      node: getElem("bc-target-keyword")
    },
    {
      name: "secondaryKeywords",
      eventType: "input",
      node: getElem("bc-secondary-keywords")
    },
    {
      name: "sectionHeader",
      eventType: "input",
      node: getElem("bc-section-header")
    },
    {
      name: "sectionHeader",
      eventType: "input",
      node: getElem("bc-section-header")
    },
    {
      name: "tone",
      eventType: "input",
      node: getElem("bc-tone")
    },
    {
      name: "tone",
      eventType: "input",
      node: getElem("bc-tone")
    },
    {
      name: "numOfExamples",
      eventType: "change",
      node: getElem("bc-number-of-examples")
    },
    {
      name: "numOfExamples",
      eventType: "change",
      node: getElem("bc-number-of-examples")
    },
    {
      name: "wordCount",
      eventType: "change",
      node: getElem("bc-words-count")
    }
  ];

  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;
    if (name === "buyerMotive") {
      const allOptions = node.querySelectorAll("option");
      allOptions.forEach((option) => {
        option.addEventListener("click", () => {
          selectedBuyerMotives = [...allOptions]
            .filter((option) => option.selected)
            .map((option) => option.textContent);

          renderSelectedMotives(node, selectedBuyerMotives);
          userInputs.buyerMotive.value = [...selectedBuyerMotives];

          const prompt = generatePrompt(promptsTexts, userInputs);
          if (prompt) {
            setPromptText(promptDisplayNode, prompt);
          }
        });
      });
    }
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;
      const prompt = generatePrompt(promptsTexts, userInputs);
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);
    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);
        gptResponseNode.innerHTML = "Loading... Please Wait";
        const prompt = generatePrompt(promptsTexts, userInputs);
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
          gptResponseNode.appendChild(response);
        } catch (error) {
          response = "Error Occured in Generating Response";
          gptResponseNode.innerHTML = response;
        }

        scrollToResponseNode();
        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

const blogOutline = () => {
  const generateResponseButton = getElem("bo-generate-response");
  let selectedBuyerMotives = [];
  const promptDisplayNode = getElem("bo-prompt-text");
  const promptsTexts = {
    brandName: (name) =>
      `Give me a structural outline for my blog post. My ecommerce brand’s name is ${name}`,
    brandNiche: (niche) => `, and we’re in the ${niche}`,
    blogTitle: (title) => `. The title of the blog post should be ${title}`,
    blogType: (type) => `, and it should be in the format of a ${type}`,
    targetKeyword: (keyword) => `. The keyword I’m targeting is ${keyword}`,
    secondaryKeywords: (keywords) =>
      `. The secondary keywords I am targeting are ${keywords}`,
    subHeaders: (headers) =>
      `, and I’d like to include the following subheaders: ${headers}`,
    tone: (tone) => `. The tone of the post should be ${tone}`,
    productCallout: (callout) =>
      `, and at least one section should call out my product, ${callout}`
  };

  const userInputs = {
    brandName: {
      value: "",
      required: true
    },
    brandNiche: {
      value: "",
      required: true
    },
    blogTitle: {
      value: "",
      required: false
    },
    targetKeyword: {
      value: "",
      required: false
    },
    secondaryKeywords: {
      value: "",
      required: false
    },
    subHeaders: {
      value: "",
      required: false
    },
    blogType: {
      value: "",
      required: false
    },
    tone: {
      value: "",
      required: true
    },
    productCallout: {
      value: "",
      required: false
    }
  };

  const elementNodes = [
    {
      name: "brandName",
      eventType: "input",
      node: getElem("bo-brand-name")
    },
    {
      name: "brandNiche",
      eventType: "change",
      node: getElem("bo-brand-niche")
    },
    {
      name: "blogTitle",
      eventType: "input",
      node: getElem("bo-blog-title")
    },
    {
      name: "targetKeyword",
      eventType: "input",
      node: getElem("bo-target-keyword")
    },
    {
      name: "secondaryKeywords",
      eventType: "input",
      node: getElem("bo-secondary-keywords")
    },
    {
      name: "subHeaders",
      eventType: "input",
      node: getElem("bo-sub-headers")
    },
    {
      name: "blogType",
      eventType: "change",
      node: getElem("bo-blog-type")
    },
    {
      name: "tone",
      eventType: "change",
      node: getElem("bo-tone")
    },
    {
      name: "productCallout",
      eventType: "input",
      node: getElem("bo-product-callout")
    }
  ];
  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;
    if (name === "buyerMotive") {
      const allOptions = node.querySelectorAll("option");
      allOptions.forEach((option) => {
        option.addEventListener("click", () => {
          selectedBuyerMotives = [...allOptions]
            .filter((option) => option.selected)
            .map((option) => option.textContent);
          renderSelectedMotives(node, selectedBuyerMotives);
          userInputs.buyerMotive.value = [...selectedBuyerMotives];

          const prompt = generatePrompt(promptsTexts, userInputs);
          if (prompt) {
            setPromptText(promptDisplayNode, prompt);
          }
        });
      });
    }
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;
      const prompt = generatePrompt(promptsTexts, userInputs);
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);
    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);
        gptResponseNode.innerHTML = "Loading... Please Wait";
        const prompt = generatePrompt(promptsTexts, userInputs);
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
          gptResponseNode.appendChild(response);
        } catch (error) {
          response = "Error Occured in Generating Response";
          gptResponseNode.innerHTML = response;
        }

        scrollToResponseNode();
        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

const seoMetaDescription = () => {
  const generateResponseButton = getElem("smd-generate-response");
  let selectedBuyerMotives = [];
  const promptDisplayNode = getElem("smd-prompt-text");
  const promptsTexts = {
    brandName: (name) => ``,
    pageType: (type) =>
      `Come up with a compelling SEO meta description for my ecommerce ${type}`,
    pageTitle: (title) =>
      `. The title of the ${userInputs.pageType.value} is ${title}`,
    maxCharCount: (count) => `. The meta description should be under ${count}`,
    callToAction: (cta) =>
      `, and should include the following call to action: ${cta}`,
    tone: (tone) => `. The tone should be ${tone}`,
    targetKeyword: (keyword) => `, and my target keyword is ${keyword}`,
    pageHeader: (header) => ``
  };
  const userInputs = {
    brandName: {
      value: "",
      required: true
    },
    pageHeader: {
      value: "",
      required: false
    },
    pageType: {
      value: "",
      required: true
    },
    tone: {
      value: "",
      required: true
    },
    targetKeyword: {
      value: "",
      required: false
    },
    maxCharCount: {
      value: "",
      required: false
    },
    callToAction: {
      value: "",
      required: false
    },
    pageTitle: {
      value: "",
      required: false
    }
  };

  const elementNodes = [
    {
      name: "brandName",
      eventType: "input",
      node: getElem("smd-brand-name")
    },
    {
      name: "pageHeader",
      eventType: "input",
      node: getElem("smd-page-header")
    },
    {
      name: "pageType",
      eventType: "change",
      node: getElem("smd-page-type")
    },
    {
      name: "tone",
      eventType: "change",
      node: getElem("smd-tone")
    },
    {
      name: "targetKeyword",
      eventType: "input",
      node: getElem("smd-target-keyword")
    },
    {
      name: "maxCharCount",
      eventType: "input",
      node: getElem("smd-max-char-count")
    },
    {
      name: "callToAction",
      eventType: "change",
      node: getElem("smd-cta")
    }
  ];

  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;
    if (name === "buyerMotive") {
      const allOptions = node.querySelectorAll("option");
      allOptions.forEach((option) => {
        option.addEventListener("click", () => {
          selectedBuyerMotives = [...allOptions]
            .filter((option) => option.selected)
            .map((option) => option.textContent);

          renderSelectedMotives(node, selectedBuyerMotives);
          userInputs.buyerMotive.value = [...selectedBuyerMotives];
          const prompt = generatePrompt(promptsTexts, userInputs);
          if (prompt) {
            setPromptText(promptDisplayNode, prompt);
          }
        });
      });
    }
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;
      const prompt = generatePrompt(promptsTexts, userInputs);
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);
    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);
        gptResponseNode.innerHTML = "Loading... Please Wait";
        const prompt = generatePrompt(promptsTexts, userInputs);
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
          gptResponseNode.appendChild(response);
        } catch (error) {
          response = "Error Occured in Generating Response";
          gptResponseNode.innerHTML = response;
        }
        scrollToResponseNode();

        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

const emailSubjectLine = () => {
  const generateResponseButton = getElem("esl-generate-response");
  let selectedBuyerMotives = [];
  const promptDisplayNode = getElem("esl-prompt-text");
  const promptsTexts = {
    brandName: (name) =>
      `Craft a clear, engaging email subject line for my ecommerce brand, ${name}`,
    productName: (name) => `. The product I’m promoting is ${name}`,
    buyerMotive: () =>
      `. I’d like to appeal to the ${formatWords(
        selectedBuyerMotives
      )} buyer motive`,
    offer: (offer) => `. The offer is a ${offer} offer`,
    tone: (tone) => `. The tone should be ${tone}`,
    maxCharCount: (count) => `. Maximum character count should be ${count}.`
  };

  const userInputs = {
    brandName: {
      value: "",
      required: true
    },
    productName: {
      value: "",
      required: false
    },
    buyerMotive: {
      value: "",
      required: false
    },
    offer: {
      value: "",
      required: false
    },
    tone: {
      value: "",
      required: false
    },
    maxCharCount: {
      value: "",
      required: false
    }
  };

  const elementNodes = [
    {
      name: "brandName",
      eventType: "input",
      node: getElem("esl-brand-name")
    },
    {
      name: "productName",
      eventType: "input",
      node: getElem("esl-product-name")
    },
    {
      name: "buyerMotive",
      eventType: "change",
      node: getElem("esl-buyer-motive")
    },
    {
      name: "offer",
      eventType: "change",
      node: getElem("esl-offer")
    },
    {
      name: "tone",
      eventType: "change",
      node: getElem("esl-tone")
    },
    {
      name: "maxCharCount",
      eventType: "input",
      node: getElem("esl-max-char-count")
    }
  ];

  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;
    if (name === "buyerMotive") {
      const allOptions = node.querySelectorAll("option");
      allOptions.forEach((option) => {
        option.addEventListener("click", () => {
          selectedBuyerMotives = [...allOptions]
            .filter((option) => option.selected)
            .map((option) => option.textContent);

          renderSelectedMotives(node, selectedBuyerMotives);

          const prompt = generatePrompt(promptsTexts, userInputs);
          if (prompt) {
            setPromptText(promptDisplayNode, prompt);
          }
        });
      });
    }
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;

      const prompt = generatePrompt(promptsTexts, userInputs);
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);
    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);
        gptResponseNode.innerHTML = "Loading... Please Wait";
        const prompt = generatePrompt(promptsTexts, userInputs);
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
        } catch (error) {
          response = "Error Occured in Generating Response";
        }

        gptResponseNode.appendChild(response);
        scrollToResponseNode();
        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

const emailCopy = () => {
  const generateResponseButton = getElem("ec-generate-response");
  const promptDisplayNode = getElem("ec-prompt-text");
  let selectedBuyerMotives = [];
  const promptsTexts = {
    brandName: (name) =>
      `Craft some clear, compelling email copy for my ecommerce brand, ${name}, that maximizes engagement`,
    productName: (name) => `. The product I’m promoting is ${name}`,
    contentPromoting: (content) => `. The content I’m promoting is ${content}`,
    subjectLine: (line) => `. The subject line is ${line}`,
    buyerMotive: () =>
      `. I’d like to appeal to the ${formatWords(
        selectedBuyerMotives
      )} buyer motive`,
    offer: (offer) => `. The offer is a ${offer} offer`,
    tone: (tone) => `. The tone should be ${tone}`,
    wordCount: (count) => `. My desired word count is ${count}`,
    cta: (cta) => `. My desired call-to-action is ${cta}`
  };
  const userInputs = {
    brandName: {
      value: "",
      required: true
    },
    subjectLine: {
      value: "",
      required: false
    },
    productName: {
      value: "",
      required: false
    },
    contentPromoting: {
      value: "",
      required: false
    },
    buyerMotive: {
      value: "",
      required: false
    },
    offer: {
      value: "",
      required: false
    },
    tone: {
      value: "",
      required: true
    },
    wordCount: {
      value: "",
      required: false
    },
    cta: {
      value: "",
      required: false
    }
  };

  const elementNodes = [
    {
      name: "brandName",
      eventType: "input",
      node: getElem("ec-brand-name")
    },
    {
      name: "subjectLine",
      eventType: "input",
      node: getElem("ec-subject-line")
    },
    {
      name: "productName",
      eventType: "input",
      node: getElem("ec-product-name")
    },
    {
      name: "contentPromoting",
      eventType: "input",
      node: getElem("ec-content-promoting")
    },
    {
      name: "buyerMotive",
      eventType: "change",
      node: getElem("ec-buyer-motive")
    },
    {
      name: "offer",
      eventType: "change",
      node: getElem("ec-offer")
    },
    {
      name: "tone",
      eventType: "change",
      node: getElem("ec-tone")
    },
    {
      name: "wordCount",
      eventType: "input",
      node: getElem("ec-word-count")
    },
    {
      name: "cta",
      eventType: "change",
      node: getElem("ec-cta")
    }
  ];

  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;

    if (name === "buyerMotive") {
      const allOptions = node.querySelectorAll("option");
      allOptions.forEach((option) => {
        option.addEventListener("click", () => {
          const selectedBuyerMotives = [...allOptions]
            .filter((option) => option.selected)
            .map((option) => option.textContent);
          renderSelectedMotives(node, selectedBuyerMotives);
          userInputs.buyerMotive.value = [...selectedBuyerMotives];
          const prompt = generatePrompt(promptsTexts, userInputs);
          if (prompt) {
            setPromptText(promptDisplayNode, prompt);
          }
        });
      });
    }
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;
      const prompt = generatePrompt(promptsTexts, userInputs);
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);
    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);
        gptResponseNode.innerHTML = "Loading... Please Wait";
        const prompt = generatePrompt(promptsTexts, userInputs);
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
          gptResponseNode.appendChild(response);
        } catch (error) {
          response = "Error Occured in Generating Response";
          gptResponseNode.innerHTML = response;
        }
        scrollToResponseNode();
        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

const smsCopy = () => {
  const generateResponseButton = getElem("sc-generate-response");
  const promptDisplayNode = getElem("sc-prompt-text");
  let selectedBuyerMotives = [];
  const promptsTexts = {
    brandName: (name) =>
      `Craft some clear, compelling SMS copy for my ecommerce brand, ${name}, that maximizes engagement`,
    productName: (name) => `. The product I’m promoting is ${name}`,
    buyerMotive: () =>
      `. I’d like to appeal to the ${formatWords(
        selectedBuyerMotives
      )} buyer motive`,
    offer: (offer) => `. The offer is a ${offer} offer`,
    tone: (tone) => `. The tone should be ${tone}`,
    wordCount: (count) => `. My desired word count is ${count}`,
    cta: (cta) => `. My desired call-to-action is ${cta}.`
  };

  const userInputs = {
    brandName: {
      value: "",
      required: true
    },
    productName: {
      value: "",
      required: false
    },
    buyerMotive: {
      value: "",
      required: false
    },
    offer: {
      value: "",
      required: false
    },
    tone: {
      value: "",
      required: true
    },
    wordCount: {
      value: "",
      required: false
    },
    cta: {
      value: "",
      required: false
    }
  };

  const elementNodes = [
    {
      name: "brandName",
      eventType: "input",
      node: getElem("sc-brand-name")
    },
    {
      name: "productName",
      eventType: "input",
      node: getElem("sc-product-name")
    },
    {
      name: "buyerMotive",
      eventType: "change",
      node: getElem("sc-buyer-motive")
    },
    {
      name: "offer",
      eventType: "change",
      node: getElem("sc-offer")
    },
    {
      name: "tone",
      eventType: "change",
      node: getElem("sc-tone")
    },
    {
      name: "wordCount",
      eventType: "input",
      node: getElem("sc-word-count")
    },
    {
      name: "cta",
      eventType: "change",
      node: getElem("sc-cta")
    }
  ];

  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;
    if (name === "buyerMotive") {
      const allOptions = node.querySelectorAll("option");
      allOptions.forEach((option) => {
        option.addEventListener("click", () => {
          selectedBuyerMotives = [...allOptions]
            .filter((option) => option.selected)
            .map((option) => option.textContent);
          renderSelectedMotives(node, selectedBuyerMotives);
          userInputs.buyerMotive.value = [...selectedBuyerMotives];
          const prompt = generatePrompt(promptsTexts, userInputs);
          if (prompt) {
            setPromptText(promptDisplayNode, prompt);
          }
        });
      });
    }
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;
      const prompt = generatePrompt(promptsTexts, userInputs);
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);
    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);
        gptResponseNode.innerHTML = "Loading... Please Wait";
        const prompt = generatePrompt(promptsTexts, userInputs);
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
          gptResponseNode.appendChild(response);
        } catch (error) {
          response = "Error Occured in Generating Response";
          gptResponseNode.innerHTML = response;
        }
        scrollToResponseNode();
        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

const productDescription = () => {
  const generateResponseButton = getElem("pd-generate-response");
  const promptDisplayNode = getElem("pd-prompt-text");
  let selectedBuyerMotives = [];
  const promptsTexts = {
    productName: (name) =>
      `Write me an engaging and compelling product description highlighting the key features of my ecommerce product: ${name}`,
    brandName: (name) => `. My brand name is ${name}`,
    buyerMotive: () =>
      `. I’d like to appeal to the ${formatWords(
        selectedBuyerMotives
      )} buyer motive`,
    keyFeatures: (features) =>
      `. The key features I’d like to call out are: ${features}`,
    keyBenefits: (benefits) =>
      `.  The key benefits I’d like to call out are: ${benefits}`,
    tone: (tone) => `. The tone should be ${tone}`,
    wordCount: (count) => `. My desired word count is ${count}`,
    offer: (offer) => ``
  };

  const userInputs = {
    productName: {
      value: "",
      required: true
    },
    brandName: {
      value: "",
      required: true
    },
    buyerMotive: {
      value: "",
      required: false
    },
    keyFeatures: {
      value: "",
      required: false
    },
    keyBenefits: {
      value: "",
      required: false
    },
    tone: {
      value: "",
      required: true
    },
    wordCount: {
      value: "",
      required: false
    },
    offer: {
      value: "",
      required: false
    }
  };

  const elementNodes = [
    {
      name: "productName",
      eventType: "input",
      node: getElem("pd-product-name")
    },
    {
      name: "brandName",
      eventType: "input",
      node: getElem("pd-brand-name")
    },
    {
      name: "buyerMotive",
      eventType: "input",
      node: getElem("pd-buyer-motive")
    },
    {
      name: "keyFeatures",
      eventType: "input",
      node: getElem("pd-key-features")
    },
    {
      name: "keyBenefits",
      eventType: "input",
      node: getElem("pd-key-benefits")
    },
    {
      name: "tone",
      eventType: "input",
      node: getElem("pd-tone")
    },
    {
      name: "wordCount",
      eventType: "input",
      node: getElem("pd-word-count")
    },
    {
      name: "offer",
      eventType: "change",
      node: getElem("pd-offer")
    }
  ];
  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;
    if (name === "buyerMotive") {
      const allOptions = node.querySelectorAll("option");
      allOptions.forEach((option) => {
        option.addEventListener("click", () => {
          selectedBuyerMotives = [...allOptions]
            .filter((option) => option.selected)
            .map((option) => option.textContent);
          renderSelectedMotives(node, selectedBuyerMotives);
          userInputs.buyerMotive.value = [...selectedBuyerMotives];

          const prompt = generatePrompt(promptsTexts, userInputs);
          if (prompt) {
            setPromptText(promptDisplayNode, prompt);
          }
        });
      });
    }
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;
      const prompt = generatePrompt(promptsTexts, userInputs);
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);
    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);
        gptResponseNode.innerHTML = "Loading... Please Wait";
        const prompt = generatePrompt(promptsTexts, userInputs);
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
          gptResponseNode.appendChild(response);
        } catch (error) {
          response = "Error Occured in Generating Response";
          gptResponseNode.innerHTML = response;
        }
        scrollToResponseNode();
        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

const landingPageCopy = () => {
  const generateResponseButton = getElem("lpc-generate-response");
  const promptDisplayNode = getElem("lpc-prompt-text");
  let selectedBuyerMotives = [];
  const promptsTexts = {
    brandName: (name) =>
      `Come up with some engaging and compelling landing page copy for my brand, ${name}`,
    productName: (name) => `. The product I am promoting is ${name}`,
    contentPromoting: (content) => `. The content I am promoting is ${content}`,
    pageTitle: (title) => `. The title of the page is ${title}`,
    // cta : (cta) => ` The key call-to-action is ${cta}.`,
    wordCount: (count) => `. My desired word count is ${count}`,
    cta: (cta) => `. The desired call-to-action is ${cta}`,
    keyFeatures: (features) => ` `,
    keyBenefits: (benefits) => ` `,
    offer: (offer) => ``,
    tone: (tone) => ``,
    buyerMotive: (motive) => ``
  };

  const userInputs = {
    brandName: {
      value: "",
      required: true
    },
    productName: {
      value: "",
      required: false
    },
    contentPromoting: {
      value: "",
      required: false
    },
    pageTitle: {
      value: "",
      required: false
    },
    wordCount: {
      value: "",
      required: false
    },
    cta: {
      value: "",
      required: false
    },
    keyFeatures: {
      value: "",
      required: false
    },
    keyBenefits: {
      value: "",
      required: false
    },
    buyerMotive: {
      value: "",
      required: false
    },
    offer: {
      value: "",
      required: false
    },
    tone: {
      value: "",
      required: true
    }
  };
  const elementNodes = [
    {
      name: "brandName",
      eventType: "input",
      node: getElem("lpc-brand-name")
    },
    {
      name: "productName",
      eventType: "input",
      node: getElem("lpc-product-name")
    },
    {
      name: "contentPromoting",
      eventType: "input",
      node: getElem("lpc-content-promoting")
    },
    {
      name: "pageTitle",
      eventType: "input",
      node: getElem("lpc-page-title")
    },
    {
      name: "wordCount",
      eventType: "input",
      node: getElem("lpc-word-count")
    },
    {
      name: "cta",
      eventType: "change",
      node: getElem("lpc-cta")
    },
    {
      name: "keyFeatures",
      eventType: "input",
      node: getElem("lpc-key-features")
    },
    {
      name: "keyBenefits",
      eventType: "input",
      node: getElem("lpc-key-benefits")
    },
    {
      name: "buyerMotive",
      eventType: "change",
      node: getElem("lpc-buyer-motive")
    },
    {
      name: "offer",
      eventType: "change",
      node: getElem("lpc-offer")
    },
    {
      name: "tone",
      eventType: "change",
      node: getElem("lpc-tone")
    }
  ];

  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;

    if (name === "buyerMotive") {
      const allOptions = node.querySelectorAll("option");
      allOptions.forEach((option) => {
        option.addEventListener("click", () => {
          selectedBuyerMotives = [...allOptions]
            .filter((option) => option.selected)
            .map((option) => option.textContent);
          renderSelectedMotives(node, selectedBuyerMotives);
          userInputs.buyerMotive.value = [...selectedBuyerMotives];

          const prompt = generatePrompt(promptsTexts, userInputs);
          if (prompt) {
            setPromptText(promptDisplayNode, prompt);
          }
        });
      });
    }
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;
      const prompt = generatePrompt(promptsTexts, userInputs);
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);
    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);
        gptResponseNode.innerHTML = "Loading... Please Wait";
        const prompt = generatePrompt(promptsTexts, userInputs);
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
          gptResponseNode.appendChild(response);
        } catch (error) {
          response = "Error Occured in Generating Response";
          gptResponseNode.innerHTML = response;
        }
        scrollToResponseNode();
        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

const campaignStrategy = () => {
  const generateResponseButton = getElem("cs-generate-response");
  const promptDisplayNode = getElem("cs-prompt-text");
  let selectedBuyerMotives = [];
  const promptsTexts = {
    campaignType: (type) =>
      ` I’m launching a ${type} campaign for my ecommerce brand,`,
    brandName: (name) => ` ${name}`,
    kpi: (kpi) => `. The main KPI we’re looking to optimize for is ${kpi}`,
    platforms: (platforms) =>
      `, and the main platforms we’re looking to use are ${platforms}`,
    productName: (name) =>
      `. We’re specifically looking to drive sales for our ${name}`
  };

  const userInputs = {
    campaignType: {
      value: "",
      required: true
    },
    brandName: {
      value: "",
      required: true
    },
    kpi: {
      value: "",
      required: false
    },
    platforms: {
      value: "",
      required: true
    },
    productName: {
      value: "",
      required: false
    }
  };

  const elementNodes = [
    {
      name: "campaignType",
      eventType: "change",
      node: getElem("cs-campaign-type")
    },
    {
      name: "brandName",
      eventType: "input",
      node: getElem("cs-brand-name")
    },
    {
      name: "kpi",
      eventType: "change",
      node: getElem("cs-kpi")
    },
    {
      name: "platforms",
      eventType: "change",
      node: getElem("cs-platforms")
    },
    {
      name: "productName",
      eventType: "input",
      node: getElem("cs-product-name")
    }
  ];

  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;
      const prompt = generatePrompt(
        promptsTexts,
        userInputs,
        ". Help me flesh out an intelligent plan to execute this campaign strategy."
      );
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);
    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);
        gptResponseNode.innerHTML = "Loading... Please Wait";
        const prompt = generatePrompt(
          promptsTexts,
          userInputs,
          " Help me flesh out an intelligent plan to execute this campaign strategy."
        );
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
          gptResponseNode.appendChild(response);
        } catch (error) {
          response = "Error Occured in Generating Response";
          gptResponseNode.innerHTML = response;
        }
        scrollToResponseNode();
        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

const socialMediaCopy = () => {
  const generateResponseButton = getElem("smc-generate-response");
  const promptDisplayNode = getElem("smc-prompt-text");
  let selectedBuyerMotives = [];
  const promptsTexts = {
    brandName: (name) =>
      `Craft some clear, compelling social media copy for my ecommerce brand, ${name}`,
    platform: (platform) =>
      `. My goal is to maximize engagement on ${platform}`,
    productName: (name) => `. The product I’m promoting is ${name}`,
    contentPromoting: (content) => `. The content I’m promoting is ${content}`,
    buyerMotive: (motive) =>
      `. I’d like to appeal to the ${motive} buyer motive`,
    offer: (offer) => `. The offer is a ${offer} offer`,
    tone: (tone) => `. The tone should be ${tone}`,
    wordCount: (count) => `. My desired word count is ${count}`,
    cta: (cta) => `. My desired call-to-action is ${cta}.`
  };

  const userInputs = {
    brandName: {
      value: "",
      required: true
    },
    platform: {
      value: "",
      required: true
    },
    productName: {
      value: "",
      required: false
    },
    contentPromoting: {
      value: "",
      required: false
    },
    buyerMotive: {
      value: "",
      required: false
    },
    offer: {
      value: "",
      required: false
    },
    tone: {
      value: "",
      required: true
    },
    wordCount: {
      value: "",
      required: false
    },
    cta: {
      value: "",
      required: false
    }
  };

  const elementNodes = [
    {
      name: "brandName",
      eventType: "input",
      node: getElem("smc-brand-name")
    },
    {
      name: "platform",
      eventType: "change",
      node: getElem("smc-platform")
    },
    {
      name: "productName",
      eventType: "input",
      node: getElem("smc-product-name")
    },
    {
      name: "contentPromoting",
      eventType: "input",
      node: getElem("smc-content-promoting")
    },
    {
      name: "buyerMotive",
      eventType: "change",
      node: getElem("smc-buyer-motive")
    },
    {
      name: "offer",
      eventType: "change",
      node: getElem("smc-offer")
    },
    {
      name: "tone",
      eventType: "change",
      node: getElem("smc-tone")
    },
    {
      name: "wordCount",
      eventType: "input",
      node: getElem("smc-word-count")
    },
    {
      name: "cta",
      eventType: "input",
      node: getElem("smc-cta")
    }
  ];

  // the nodes listener
  elementNodes.forEach((element) => {
    const { name, eventType, node } = element;
    if (name === "buyerMotive") {
      const allOptions = node.querySelectorAll("option");
      allOptions.forEach((option) => {
        option.addEventListener("click", () => {
          selectedBuyerMotives = [...allOptions]
            .filter((option) => option.selected)
            .map((option) => option.textContent);
          renderSelectedMotives(node, selectedBuyerMotives);
          userInputs.buyerMotive.value = [...selectedBuyerMotives];
          const prompt = generatePrompt(promptsTexts, userInputs);
          if (prompt) {
            setPromptText(promptDisplayNode, prompt);
          }
        });
      });
    }
    node.addEventListener(eventType, (e) => {
      userInputs[name].value = e.target.value;

      const prompt = generatePrompt(promptsTexts, userInputs);
      if (prompt) {
        setPromptText(promptDisplayNode, prompt);
      }
    });
  });

  // this will also get triggered from the callback of onSuccessFormSubmission
  generateResponseButton.addEventListener("click", async (e) => {
    lastClickedButton = generateResponseButton;
    setTriggerButtonAttribute(generateResponseButton);
    const shouldProceed = shouldGeneratePrompt(userInputs);
    if (shouldProceed) {
      gptResponseNode.innerHTML = "";
      // means a prompt exist which can be sent to chat GPT
      // check if the form has already been submitted or not;
      const hasAlreadySubmitted = hasAlreadySubmittedForm();
      if (hasAlreadySubmitted) {
        showAndScrollToElement(gptResponseWrapper);
        gptResponseNode.innerHTML = "Loading... Please Wait";
        const prompt = generatePrompt(promptsTexts, userInputs);
        let response;

        try {
          response = await makeRequestToChatGPT(prompt);
          gptResponseNode.innerHTML = "";
          gptResponseNode.appendChild(response);
        } catch (error) {
          response = "Error Occured in Generating Response";
          gptResponseNode.innerHTML = response;
        }
        scrollToResponseNode();
        // generate the response from Chat GPT
      } else {
        // show the form;
        formPopup.style.display = "flex";
      }
    }
  });
};

// function calls

SEOMetaTitle();

adCopy();
blogCopy();
blogOutline();
seoMetaDescription();
emailSubjectLine();
emailCopy();
smsCopy();
productDescription();
landingPageCopy();
campaignStrategy();
socialMediaCopy();
