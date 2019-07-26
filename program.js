const fs = require('fs');
const readline = require('readline');

let format = [
  {name:'I', number:1},
  {name:'V', number:5},
  {name:'X', number:10},
  {name:'L', number:50},
  {name:'C', number:100},
  {name:'D', number:500},
  {name:'M', number:1000},
]

let cv = {}
let output = '';

function isMetal(line) {
  const currency = Object.keys(cv)
  const check = {metal: false, currency: false};
  for ( let m of currency){
    if (line.indexOf(m) > -1){ 
      check.currency = true;
      if(m === 'Silver' || m === 'Gold' || m === 'Iron'){
        check.metal = true;
      }
    }
  }
  return check;
}

function checkLine (line){
  //Check first input format e.g. glob is I
  if (/^[a-z]{4}\sis\s[I|V|X|L|C|D|M]{1}$/.test(line)) {
    const filtered = format.find(f => f.name === line[line.length - 1])
    const item = {
      name: line.substring(0, 4), 
      number: filtered.number
    }
    cv[item.name] = item.number
  }

  //Check second input format e.g. glob glob silver is 34 credits
  if(/^[a-z]{4}\s[a-z]{4}\s(Silver|Gold|Iron)\sis\s[0-9]*\sCredits$/.test(line)){
    const split = line.split(' ')
    const firstCurrency =  cv[split[0]]
    const secondCurrency =  cv[split[1]]
    const calculation = firstCurrency < secondCurrency ?  secondCurrency - firstCurrency :  firstCurrency + secondCurrency
    const metalUnit = split[4] / calculation
    cv[split[2]] = metalUnit
  }
  
  //Check whether there is any gibberish
  if (!isMetal(line).currency){
    output += 'I have no idea what you are talking about\n';
    console.log('I have no idea what you are talking about')
  } 

  //Check third input format as e.g. how much is ... or how many credit is ...
  if(/^how much is|^how many Credits is/.test(line)){
    const newSplit = line.split('is ')[1].split(' ?')[0];;
    const newSub = newSplit.split(' ');
    let initial;
    let result = 0;
    for (var i = 0; i<newSub.length; i++){
      let next = i + 1;
      if( i === initial){
        continue;
      }
      
      if (isMetal(newSub[i]).metal){
        result = result === 0 ? cv[newSub[i]] : result * cv[newSub[i]]
      } else {
        if (next === newSub.length - 1){result += cv[newSub[i]]}
        if (cv[newSub[i]] === cv[newSub[next]]){
          //D, L and V cannot be repeated`
          if(cv[newSub[i]].toString()[0] ==='5'){
            result = `D, L and V cannot be repeated`
            break;
          }
          //The symbols I, X, C and M can be repeated 3 times in succession, but not more
          if (cv[newSub[next]] === cv[newSub[next + 1]] === cv[newSub[next + 2]]){
            result = `The symbols I, X, C and M can be repeated 3 times in succession, but not more`
            break;
          }
          else {
            result += cv[newSub[i]]
          }
        }
  
        if (cv[newSub[i]] > cv[newSub[next]]){ 
          result += cv[newSub[i]]
        } else if (cv[newSub[i]] < cv[newSub[next]]){
          //check whether it is 5, 500, or 500 , then no need to be reduced;
          if(cv[newSub[i]].toString()[0] ==='5'){
            result += cv[newSub[i]]
          }else {
            //check whether it is equivalent to multiply of 5 or 10 of current value
            if(cv[newSub[next]] === 5*cv[newSub[i]] || cv[newSub[next]] === 10*cv[newSub[i]]){
              result += (cv[newSub[next]] - cv[newSub[i]])
              initial = next;
            }  
          }
        }
      }
      
    }
    if (isMetal(newSplit).metal){
      output += `${newSplit} is ${result} Credits\n`;
      console.log(`${newSplit} is ${result} Credits`)
    } else {
      output += `${newSplit} is ${result}\n`;
      console.log(`${newSplit} is ${result}`)
    }
  }
}

async function processLineByLine() {
  const fileStream = fs.createReadStream('input.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    // console.log(`Line from file: ${line}`);
    checkLine(line)
  }
  fs.writeFile('output.txt', output, (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    console.log('Output saved!');
  });
}

processLineByLine();
