const baseUrl = 'https://fdnd.directus.app/items/person/';
const meFilter = '?filter={"id": 195}';
const othersFilter = '?filter={"_and":[{"squads":{"squad_id":{"tribe":{"name":"CMD%20Minor%20Web%20Dev"}}}},{"squads":{"squad_id":{"cohort":"2425"}}}]}';

// Create URLs with different filters
const meUrl = baseUrl + meFilter;
const othersUrl = baseUrl + othersFilter;

// Fetch my data
const fetchedMe = await fetch(meUrl);
const meData = await fetchedMe.json();

// Fetch others data
const fetchedOthers = await fetch(othersUrl);
const othersData = await fetchedOthers.json();

// Parse the custom field for each person before passing to template
meData.data = meData.data.map(person => ({
    ...person,
    customData: JSON.parse(person.custom)  // Add parsed custom data
}));

const template = document.querySelector('template');
const result = document.querySelector('#contentOverlay');
const engine = new liquidjs.Liquid();


engine.parseAndRender(template.innerHTML, { me: meData.data,
    others: othersData.data})
    .then(html => {
        result.innerHTML = html;

        thisYear();
    });


function thisYear() {
    const today = new Date();
    const thisYear = today.getFullYear();
    const thisYearSpan = document.querySelector('footer span');
    thisYearSpan.textContent = thisYear;
}

function daysUntil() {
    const birthdayContainers = document.querySelectorAll('.birthday-container');
    console.log('Found containers:', birthdayContainers.length);

    birthdayContainers.forEach(container => {
        // Check the data attribute value
        console.log('Birthdate data:', container.dataset.birthdate);

        const birthdate = new Date(container.dataset.birthdate);
        console.log('Parsed birthdate:', birthdate);

        const daysUntilSpan = container.querySelector('.days-until');
        console.log('Found span:', daysUntilSpan);

        const today = new Date();
        const nextBirthday = new Date(
            today.getFullYear(),
            birthdate.getMonth(),
            birthdate.getDate()
        );

        // If birthday has passed this year, add a year
        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        // Calculate days difference
        const daysUntil = Math.ceil(
            (nextBirthday - today) / (1000 * 60 * 60 * 24)
        );

        console.log('Days until:', daysUntil);

        if (daysUntilSpan) {
            daysUntilSpan.textContent = daysUntil;
        } else {
            console.error('Could not find days-until span');
        }
    });
}


function daysOld() {
    const birthdayContainers = document.querySelectorAll('.birthday-container');
    console.log('Found containers:', birthdayContainers.length);

    birthdayContainers.forEach(container => {
        // Check the data attribute value
        console.log('Birthdate data:', container.dataset.birthdate);

        const birthdate = new Date(container.dataset.birthdate);
        console.log('Parsed birthdate:', birthdate);

        const daysOldSpan = container.querySelector('.days-old');
        console.log('Found span:', daysOldSpan);

        const today = new Date();
        const nextBirthday = new Date(
            today.getFullYear(),
            birthdate.getMonth(),
            birthdate.getDate()
        );

        const ageInDays = Math.floor(
            (today - birthdate) / (1000 * 60 * 60 * 24)
        );

        if (daysOldSpan) {
            daysOldSpan.textContent = ageInDays;
        } else {
            console.error('Could not find days-until span');
        }
    });
}