import '@testing-library/jest-dom';
import axios from 'axios'

test('events in db', async () => {
    // await axios.post('http://localhost:3001/api/sync-ticketmaster') 
    // .then(res => {
    //     console.log(res);
    // })
    // .catch(err => {
    //     console.log(err);
    // })
    const TICKETMASTER_API_KEY = "pmbdy5uLSZnpbGGenJyLkA7xeRCPS20L";
    const url = 'https://app.ticketmaster.com/discovery/v2/events.json';
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      city: 'Chicago',
      stateCode: 'IL',
    //   size: size.toString(),
    //   page: page.toString(),
      sort: 'date,asc'
    });

    const tmResponse = await axios.get(`${url}?${params}`)
    .catch( err => {throw new Error(`Ticketmaster API error: ${tmResponse.status}`)});


    // const tmData = await tmResponse.json();
    console.log( tmResponse.data._embedded.events);

    if (tmEvents.length === 0) {
     console.log('No events found from Ticketmaster');
    }
})