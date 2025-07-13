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
/*
[
  {
    $match: {
      track: ObjectId("682b2212496adccc0c521da9")
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $unwind: {
      path: "$user",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $sort: {
      createdAt: 1
    }
  },
  {
    $facet: {
      comments: [
        {
          $project: {
            _id: 1,
            content: "$text",
            parent: 1,
            createdAt: 1,
            user: {
              _id: "$user._id",
              name: "$user.name"
            }
          }
        }
      ],
      trackInfo: [
        {
          $limit: 1
        },
        {
          $lookup: {
            from: "tracks",
            let: {
              trackId: "$track"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      "$_id",
                      ObjectId(
                        "682b2212496adccc0c521da9"
                      )
                    ]
                  }
                }
              },
              {
                $lookup: {
                  from: "users",
                  localField: "artist",
                  foreignField: "_id",
                  as: "artist"
                }
              },
              {
                $unwind: {
                  path: "$artist",
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  artist: {
                    _id: "$artist._id",
                    name: {
                      $ifNull: [
                        "$artist.artistProfile.artistName",
                        "$artist.name"
                      ]
                    },
                    artistProfile:
                      "$artist.artistProfile"
                  }
                }
              }
            ],
            as: "track"
          }
        },
        {
          $unwind: {
            path: "$track",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            artistId: "$track.artist._id",
            trackTitle: "$track.title",
            artist: "$track.artist"
          }
        },
        {
          $lookup: {
            from: "tracks",
            localField: "artistId",
            foreignField: "artist",
            as: "artistTracks"
          }
        },
        {
          $addFields: {
            numTracks: {
              $size: "$artistTracks"
            }
          }
        },
        {
          $project: {
            trackTitle: 1,
            artist: 1,
            numTracks: 1
          }
        }
      ]
    }
  }
]

*/
/*
[
  {
    $match: {
      _id: ObjectId("682b2212496adccc0c521da9")
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "artist",
      foreignField: "_id",
      as: "artist"
    }
  },
  {
    $unwind: {
      path: "$artist",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $lookup: {
      from: "tracks",
      localField: "artist._id",
      foreignField: "artist",
      as: "artistTracks"
    }
  },
  {
    $lookup: {
      from: "comments",
      let: {
        trackId: "$_id"
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$track", "$$trackId"]
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 0,
            content: "$text",
            parent: 1,
            user: {
              name: "$user.name"
            }
          }
        }
      ],
      as: "comments"
    }
  },
  {
    $project: {
      _id: 0,
      title: 1,
      artist: {
        name: {
          $ifNull: [
            "$artist.artistProfile.artistName",
            "$artist.name"
          ]
        }
      },
      numTracks: {
        $size: "$artistTracks"
      },
      comments: 1
    }
  }
]
*/