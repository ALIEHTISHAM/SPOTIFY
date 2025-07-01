/*
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
*/

const express = require('express');

function runAllTasksInParallel() {
  return new Promise(async (resolve, reject) => {
    try {
      const batch1 = Promise.all([
        Promise.resolve('Task 1A'),
        Promise.resolve('Task 1B'),
        Promise.resolve('Task 1C'),
      ]);

      const batch2 = Promise.all([
        new Promise((_, reject) => setTimeout(() => reject('Task 2A failed'), 1000)),
        Promise.resolve('Task 2B'),
        Promise.resolve('Task 2C'),
      ]);

      const batch3 = Promise.all([
        Promise.resolve('Task 3A'),
        Promise.resolve('Task 3B'),
        Promise.resolve('Task 3C'),
      ]);

      resolve(
        await Promise.all([batch1, batch2, batch3])
      );
    } catch (err) {
      console.error('Error inside runAllTasksInParallel:', err);
      reject(err);
    }
  });
}
function runAllTasksInParallelPartial() {
  return new Promise(async (resolve, reject) => {
    const batch1 = Promise.allSettled([
      Promise.resolve('Task 1A'),
      Promise.resolve('Task 1B'),
      Promise.resolve('Task 1C'),
    ]);

    const batch2 = Promise.allSettled([
      new Promise((_, reject) => setTimeout(() => reject('Task 2A failed'), 1000)),
      Promise.resolve('Task 2B'),
      Promise.resolve('Task 2C'),
    ]);

    const batch3 = Promise.allSettled([
      Promise.resolve('Task 3A'),
      Promise.resolve('Task 3B'),
      Promise.resolve('Task 3C'),
    ]);

    resolve(
     await Promise.all([batch1, batch2, batch3])
        )
  });
}

const app = express();
const port = 3000;

app.get('/test-parallel', async (req, res) => {
  try {
    const result = await runAllTasksInParallel();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete tasks', details: error });
  }
});

app.get('/test-partial-parallel', async (req, res) => {
  try {
    const result = await runAllTasksInParallelPartial();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete tasks', details: error });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
