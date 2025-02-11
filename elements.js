function activateElement(element, bool) {
    const targetElement = document.querySelector(element);
    if (!targetElement) {
        console.warn(`Element "${element}" not found`);
        return;
    }
    targetElement.style.display = bool ? "flex" : "none";
}

export function addModelAtHeight(scrollPosition) {
    let wholeScroll = Math.round(scrollPosition);
    console.log("Current scroll position:", wholeScroll);

    switch (wholeScroll) {
        case -20:
            activateElement('section:nth-of-type(3)', false);
            break;

        case -19:
            activateElement('section:nth-of-type(3)', true);
            break;

        case -17:
            activateElement('section:nth-of-type(3)', true);
            break;

        case -16:
            activateElement('section:nth-of-type(3)', false);
            break;

        case -15:
            break;

        case -14:
            activateElement('section:nth-of-type(2)', false);
            break;

        case -12:
            activateElement('section:nth-of-type(2)', true);
            break;

        case -10:
            activateElement('section:nth-of-type(2)', false);
            break;

        case -6:
            activateElement('section:nth-of-type(1)', false);
            break;
        case -3:
            activateElement('section:nth-of-type(1)', true);
            break;
        case -1:
            activateElement('section:nth-of-type(1)', false);
            activateElement('header', false);
            break;
        case 0:
            activateElement('header', true);
            break;
    }
}
 