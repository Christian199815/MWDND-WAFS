const url = 'https://fdnd.directus.app/items/person/?filter={"id": 195}';

const fetched = await fetch(url);
const data = await fetched.json();

const template = document.querySelector('template');
const result = document.querySelector('#contentOverlay');
const engine = new liquidjs.Liquid();

// First render the template
engine.parseAndRender(template.innerHTML, {persons: data.data})
    .then(html => {
        result.innerHTML = html;
        
        // After temdplate is rendered, calculate birthdays
    //    daysUntil();
    //    daysOld();
    });

function daysUntil(){
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


function daysOld(){
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