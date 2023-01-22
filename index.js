const { google } = require("googleapis");
const spreadsheetId = "1y77zUDzQY57l5elokhih6JUniZi93OZMr-z2c_pS7iI"
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});


const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets"

});

readline.question('Welke maand?', async (month) => {
    //Connecting to google spreadsheets
    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client})

    //gets fooi
    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "Reacties",
    })

    //Gets data from Reacties
    const getFooi = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "Dagoverzicht",
    })

    const fooi = {}
    getFooi.data.values.forEach(data => {
        if(data[0])fooi[data[0]] = parseFloat(data[2].replace(',','.'))
    })


    //Filters all rows so it only gets data from the desired month
    const rows = getRows.data.values.filter(x => x[2].endsWith(`${month}-2023`))

    //Formatting to daily format structured:
    //{
    //  '1-1-2023': {
    //      fooi: '',
    //      totaal_uren: '',
    //      fooi_uur: ''
    //      personen: [],
    //  },
    //  ect...
    //}
    let fooiData = {};

    //Maps all inputs to their respective day
    for(data of rows){
        if(!fooiData[data[2]]){
            fooiData[data[2]] = {
                fooi: fooi[data[2]],
                totaal_uren: 0,
                fooi_uur: 0,
                personen:[{naam:data[1], uren: parseFloat(data[7].replace(',','.'))}]
            }
        }else {
            fooiData[data[2]].personen.push({naam:data[1], uren: parseFloat(data[7].replace(',','.'))})
        }
    }

    fooiUitkeer = {}

    for(key in fooiData){
        fooiData[key].personen.forEach(x => fooiData[key].totaal_uren += x.uren);
        fooiData[key].fooi_uur = fooiData[key].fooi / fooiData[key].totaal_uren

        fooiData[key].personen.forEach(x => {
            if(x.naam in fooiUitkeer){
                fooiUitkeer[x.naam] =  fooiUitkeer[x.naam] + (x.uren * fooiData[key].fooi_uur);
            }else{
                fooiUitkeer[x.naam] = x.uren * fooiData[key].fooi_uur;
            }
            fooiUitkeer[x.naam] = Math.round(fooiUitkeer[x.naam] * 100) / 100

        })
    }

    console.log(fooiUitkeer)

    //Check
    let totaal = 0;
    for(key in fooiUitkeer){
        totaal += fooiUitkeer[key]
    }
    console.log(totaal)



    //console.log(fooiData)
    readline.close();
});
