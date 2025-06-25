
//---------Closures--------------------------
function outer() {
    let outerVar = 'I am from outer!';
    function inner() {
      console.log(outerVar); // ✅ Can access outerVar because of lexical scope
    }
    inner();
  }
  outer();

//-------------------SCOPE--------------------------------
function testScope() {
  let x = 1;
  if (true) {
    let y = 2;
    console.log(x); // 1
  }
  console.log(typeof y); // undefined
}

testScope();

//-----------------------------THIS------------------------

const obj={
  name:"Ali",
  greet(){
    console.log(`Hello  ${this.name}`);
  }
}
obj.greet();
//---------------PROMISES------------------------------------
const promise= new Promise((resolve,reject)=>{
  const success=true;
  success ? resolve("Done"):reject("Error");
});

promise.then(result=>console.log(result))
.catch(error=>console.log(error));

async function f() {
  return 5;
}
// is equivalent to:
function f() {
  return Promise.resolve(5);
}

f().then(result=>console.log(f()));