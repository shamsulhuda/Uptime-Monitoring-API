// Title:: workers library //

// Dependencies
const data = require('./data');
const { parseJSON } = require('../helpers/utilities');

// worker object - module scaffolding
const worker = {};

// lookup all the checks
worker.gatherAllchecks = () => {
    data.list('checks', (err, checks)=>{
        if(!err && checks && checks.length > 0){
            checks.forEach(check => {
                //read the check data
                data.read('checks',check, (err1, originalCheckData)=>{
                    if(!err1 && originalCheckData){
                        //pass the data to next process
                        worker.validateCheckData(parseJSON(originalCheckData));
                    }else{
                        console.log('Error:: reading one of the checks data!');
                    }
                })
            })
        }else{
            console.log('Error: Could not found any checks to process!');
        }
    })
}

// validate indivisual check data
worker.validateCheckData = (originalCheckData)=>{
    let originalData = originalCheckData;
    if(originalCheckData && originalCheckData.id){
        originalData.state = typeof(originalCheckData.state) === 'string' && 
            ['up','down'].indexOf(originalCheckData.state) > -1 
                ? originalCheckData.state : 'down';
        
                originalData.lastChecked = typeof(originalCheckData.lastChecked) === 'number' 
            && originalCheckData.lastChecked > 0 
                ? originalCheckData.lastChecked
                : false;
        worker.performCheck(originalData);
    }else{
        console.log('Invalid data');
    }
}
worker.loop = () => {
    setInterval(()=>{
        worker.gatherAllchecks();
    },1000 * 60)
}
// Start workers
worker.init = () => {
    // Execute all checks
    worker.gatherAllchecks();

    // call the for check
    worker.loop();
}

module.exports = worker;