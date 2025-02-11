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


const idCount = countObjectsWithId(othersData);           // Returns number of objects with IDs
const nicknames = getAllNicknames(othersData);            // Returns array of non-empty nicknames
const randomBio = getRandomBio(othersData);              // Returns a random non-empty bio
const closest = findClosestBirthday(othersData);


engine.parseAndRender(template.innerHTML, { 
    me: meData.data,
    others: othersData.data,     
    stats: {
        totalCount: idCount,
        allNicknames: nicknames,
        randomBio: randomBio
    },
    nextBirthday: {
        name: closest.name,
        days: closest.days,
        date: closest.birthdate
    }})
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

function findClosestBirthday(peopleData) {
    const today = new Date();
    let closestPerson = null;
    let minimumDays = Infinity;

    // Loop through each person in the data
    peopleData.data.forEach(person => {
        if (!person.birthdate) return; // Skip if no birthdate

        const birthdate = new Date(person.birthdate);
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

        // Update if this is the closest birthday so far
        if (daysUntil < minimumDays) {
            minimumDays = daysUntil;
            closestPerson = person;
        }
    });

    return {
        name: closestPerson?.name || 'No one found',
        days: minimumDays === Infinity ? 0 : minimumDays,
        birthdate: closestPerson?.birthdate
    };
}

// You can then use this in your original function:
function daysUntil() {
    const birthdayContainers = document.querySelectorAll('.birthday-container');
    
    // Your existing code...

    // Add this to find and display the closest birthday
    const closest = findClosestBirthday(peopleData); // Make sure peopleData is your JSON data
    console.log(`Next birthday: ${closest.name} in ${closest.days} days (${closest.birthdate})`);

    // Optionally update the DOM to show this information
    const nextBirthdayContainer = document.createElement('div');
    nextBirthdayContainer.innerHTML = `
        <p>Next birthday: ${closest.name} in ${closest.days} days</p>
    `;
    document.body.appendChild(nextBirthdayContainer);
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


// 1. Count objects with ID
function countObjectsWithId(data) {
    return data.data.filter(obj => obj.hasOwnProperty('id')).length;
}

// 2. Get array of all nicknames
function getAllNicknames(data) {
    return data.data
        .map(obj => obj.nickname)
        .filter(nickname => nickname !== null && nickname !== "");
}

// 3. Get random bio
function getRandomBio(data) {
    const biosWithContent = data.data.filter(obj => obj.bio !== null && obj.bio !== "");
    const randomIndex = Math.floor(Math.random() * biosWithContent.length);
    return biosWithContent[randomIndex].bio;
}