const baseUrl = 'https://fdnd.directus.app/items/person/';
const meFilter = '?filter={"id": 195}';
const othersFilter = '?filter={"_and":[{"squads":{"squad_id":{"tribe":{"name":"CMD%20Minor%20Web%20Dev"}}}},{"squads":{"squad_id":{"cohort":"2425"}}}]}';

// Create URLs with different filters
const meUrl = baseUrl + meFilter;                           // combine the base URL with the me Filter
const othersUrl = baseUrl + othersFilter;                   // combine the base URL with the others Filter

// Fetch my data
const fetchedMe = await fetch(meUrl);                       // store the fetch from the me URL
const meData = await fetchedMe.json();                      // conver the stored fetch in to JSON

// Fetch others data
const fetchedOthers = await fetch(othersUrl);               // store the fetch from the others URL
export let othersData = await fetchedOthers.json();              // convert the stored fetch in to JSON

// Parse the custom field for each person before passing to template
meData.data = meData.data.map(person => ({
    ...person,
    customData: {
        ...JSON.parse(person.custom),
        Leerdoelen: Object.values(JSON.parse(person.custom).Leerdoelen)
    }
}));

const template = document.querySelector('template');        //store the content from <template>
const result = document.querySelector('.contentOverlay');   //store the main named "contentOverlay"
const engine = new liquidjs.Liquid();                       //init the Liquid Engine


const idCount = countObjectsWithId(othersData);             // Returns number of objects with IDs
const nicknames = getAllNicknames(othersData);              // Returns array of non-empty nicknames
const randomBio = getRandomBio(othersData);                 // Returns a random non-empty bio
const closest = findClosestBirthday(othersData);            // Returns the data content name, days, date and age

// extract the html from <template>
// put the different data maps and variables in it
// past the html back in to the <template>
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
        date: closest.birthdate,
        nextAge: closest.nextAge
    }})
    .then(html => {
        result.innerHTML = html;


        thisYear();
    });

//find this years year
function thisYear() {
    const today = new Date();
    const thisYear = today.getFullYear();
    const thisYearSpan = document.querySelector('.year');
    thisYearSpan.textContent = thisYear;
}

// Calculate the amount of days from now until someone's birthday
// Do this for all objects in the data set
// Only on the objects that have a birthdate
export function findClosestBirthday(peopleData) {
    const today = new Date();
    let closestPerson = null;
    let minimumDays = Infinity;
    let nextAge = 0;

    // Check for today's birthdays first
    for (const person of peopleData.data) {
        if (!person.birthdate) continue;
        
        const birthdate = new Date(person.birthdate);
        if (birthdate.getMonth() === today.getMonth() && 
            birthdate.getDate() === today.getDate()) {
            return {
                name: person.name,
                days: 0,
                birthdate: person.birthdate,
                nextAge: today.getFullYear() - birthdate.getFullYear()
            };
        }
    }

    // If no birthday today, find next closest
    for (const person of peopleData.data) {
        if (!person.birthdate) continue;

        const birthdate = new Date(person.birthdate);
        const nextBirthday = new Date(
            today.getFullYear(),
            birthdate.getMonth(),
            birthdate.getDate()
        );

        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        const daysUntil = Math.ceil(
            (nextBirthday - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntil < minimumDays) {
            minimumDays = daysUntil;
            closestPerson = person;
            nextAge = nextBirthday.getFullYear() - birthdate.getFullYear();
        }
    }

    return {
        name: closestPerson?.name || 'No one found',
        days: minimumDays === Infinity ? 0 : minimumDays,
        birthdate: closestPerson?.birthdate,
        nextAge: nextAge || 0
    };
}

// Count objects with ID so we get all the people from the class
function countObjectsWithId(data) {
    return data.data.filter(obj => obj.hasOwnProperty('id')).length;
}

// Get array of all nicknames so we can show these
function getAllNicknames(data) {
    return data.data
        .map(obj => obj.nickname)
        .filter(nickname => nickname !== null && nickname !== "")
        .sort(() => Math.random() - 0.5);  // Randomizes the array
}

// Get random bio from one of the objects, if there is no bio filled than it will return a new one.
function getRandomBio(data) {
    const biosWithContent = data.data.filter(obj => obj.bio !== null && obj.bio !== "");
    const randomIndex = Math.floor(Math.random() * biosWithContent.length);
    return {
        bio: biosWithContent[randomIndex].bio,
        name: biosWithContent[randomIndex].name
    };
}

window.findClosestBirthday = findClosestBirthday;
window.othersData = othersData;