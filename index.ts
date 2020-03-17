// why reactive? - why make an observable out of something like an api request when it only ever returns a single value? by modeling something in a reactive way we get access to all the functionality of rxjs - things like easily retrying a request if it fails - we could write one line of code that says if this request fails and it failed because of some transient issue, wait a little and re-query it
// basically modelling things in a reactive way gives us access to all of the benefits of the rxjs library and operators - makes code more declarative and succinct
// start thinking in a push model instead of a push model - we're no longer looping through an array we're essentially saying 'hey object, if you have a new value give it to me'

import {
  of,
  interval,
  fromEvent,
  Observable,
  timer,
  from,
  defer,
  range,
  Subject,
  AsyncSubject,
  BehaviorSubject,
  ReplaySubject,
  ConnectableObservable
} from "rxjs";
import {
  mergeMap,
  flatMap,
  map,
  distinctUntilChanged,
  debounceTime,
  switchMap,
  take,
  tap,
  publish,
  finalize,
  merge,
  concat,
  reduce,
  scan
} from "rxjs/operators";
import $ from "jquery";

const letters = of("a", "b", "c");

//interval returns a counter for each tick, so 1, 2, 3, etc

const result = letters.pipe(
  flatMap(x =>
    interval(1000).pipe(
      map(i => {
        console.log(x);
        return x + i;
      })
    )
  )
);

// result.subscribe( x => console.log(x))

//--------------------------------------------------------------------

//debounce, switchmap, distinctUntilChanged, - doubounces search in an input bar

const title = $("#input");
const results = $("#results");

//fromEvent is helpful regarding event listeners because it doesn't actually add the listener until it is subscribed to (is needed) and when it unsubscribes that handler is removed from the dom

fromEvent(title, "keyup")
  .pipe(
    map(e => e.target.value),
    distinctUntilChanged(),
    debounceTime(250),
    switchMap(getItems)
  )
  .subscribe(items => {
    results.empty();
    results.append(items.map(i => $("<li />").text(i)));
  });

function getItems(title) {
  console.log(`Querying ${title}`);
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      resolve([title, "Item 2", `Another ${Math.random()}`]);
    }, 500);
  });
}

//--------------------------------------------------------------------

//observables are lazy, they do not run the generator function until they are subscribed to

//creating an interval observable and custom subscriber function

//what is an operator in rxjs? it's simply an observable that wraps another observable

//an observable is nothing more than a generator function that is invoked every time it is subscribed to

//a subscription is nothing more than a next(), error(), and complete() method that gets passed into the subscribe

function createInterval$(time) {
  return new Observable(observer => {
    let index = 0;
    let interval = setInterval(() => {
      console.log(`generating ${index}`);
      observer.next(index++);
    }, time);
    return () => {
      clearInterval(interval);
    };
  });
}

//subscriber logger

function createSubscriber(tag) {
  return {
    next(item) {
      console.log(`${tag}.next ${item}`);
    },
    error(error) {
      console.log(`${tag}.error ${error.stack || error}`);
    },
    complete() {
      console.log("complete");
    }
  };
}

// a customized take operator -

function take$(sourceObservable$, amount) {
  return new Observable(observer => {
    let count = 0;
    const subscription = sourceObservable$.subscribe({
      next(item) {
        observer.next(item);
        if (++count >= amount) {
          observer.complete();
        }
      },
      error(error) {
        observer.error(error);
      },
      complete() {
        observer.complete();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  });
}

// const everySecond$ = createInterval$(1000);
// const firstFiveSeconds$ = take$(everySecond$, 5)
// const subscription = firstFiveSeconds$.subscribe(createSubscriber('one'))

//------------------------------------------------------------------------------

//interval observable that emits every half a second, five times

const interval$ = interval(500).pipe(take(5));

// interval$.subscribe(createSubscriber('interval'))

//waits 3 seconds, then begins emitting values every second (second param is a period value) - the value being emitted is the index of the timer, or the emission count, so 0, 1, 2, etc....

const timer$ = timer(3000, 1000);

// timer$.subscribe(createSubscriber('timer'))

//wraps a value into an observable - emits arguments in order and then completes

const of$ = of("hello world", "thingy", "banana");

// of$.subscribe(createSubscriber('of'))

//takes an array-like value and flattens it - from always expects an iterable - it will iterate over and pass each item as it's next value - this would emit 'hello' and then next it would emit 'world' - if you were to pass a string every character would be emitted one at a time as the next value - great way to take an existing array and perform actions on each item

const from$ = from(["hello", "world"]);

// from$.subscribe(createSubscriber('from'))

//defer creates a generator function and invokes the function every time it is subscribed to

let sideEffect = 0;
const defer$ = defer(() => {
  sideEffect++;
  return of(sideEffect);
});

// defer$.subscribe(createSubscriber('1'))
// defer$.subscribe(createSubscriber('2'))
// defer$.subscribe(createSubscriber('3'))

//emits values one by one through the selected range - doesn't work like python's range method - the first argument is the starting point and the second argument is how far to count up from that first argument - also it's not inclusive so you get 10 - 39 as values

const range$ = range(10, 30);

// range$.subscribe(createSubscriber('range'))

//------------------------------------------------------------------------------------

// Subjects - another reactive primitive - they are an object that is both and observable and observer - often used to bridge non-reactive code with reactive code
// warning - generally should be used only in the context of bridging reactive and non-reactive code. Often you can get away without using them.

//can be used to emit values and be subscribed to at the same time

//this setup allows us to subscribe to the observable only once, but pass those subscriptions on to a subject that can be subscribed to many times - the subject acting as a proxy for the observable

const simple$ = new Subject();

// simple$.subscribe(createSubscriber('simple'))

// simple$.next('foo')
// simple$.next('bar')
// simple$.complete()

const intervalTwo$ = interval(1000).pipe(
  tap(thing => console.log("log me")),
  take(5)
);
const intervalSubject$ = new Subject();
// intervalTwo$.subscribe(intervalSubject$)

// intervalSubject$.subscribe(createSubscriber('sub1'))
// intervalSubject$.subscribe(createSubscriber('sub2'))
// intervalSubject$.subscribe(createSubscriber('sub3'))

//this setup illustrates how a late subscription does not recieve the latest emitted value

//with a normal subject we'll log 'false, true, true'
// with a behavior subject we will log 'false, false, false, true, true'

// const currentUser$ = new Subject()
const currentUser$ = new BehaviorSubject({ isLoggedIn: false });
const isLoggedin$ = currentUser$.pipe(map(u => u.isLoggedIn));

// isLoggedin$.subscribe(createSubscriber('isLoggedIn'))

currentUser$.next({ isLoggedIn: false });

// setTimeout(() => {
//   currentUser$.next({isLoggedIn: true})
// }, 2000)

//this late subsciber logs 'true' -  even though the subscription takes place before the true value is emitted from the subject, the subscriber does not pick up the first emitted value

// setTimeout(() => {
//   isLoggedin$.subscribe(createSubscriber('delayed'))
// }, 1000)

//-----------------------------------------------------------------------------

//replay subject -

const replay$ = new ReplaySubject(3);
replay$.next(1);
replay$.next(2);
replay$.next(3);
replay$.next(4);
replay$.next(5);
replay$.next(6);

//this subscribe will log '4,5,6'  - the replay subject hangs on to it's last three values and emits those one when subscribed to

// replay$.subscribe(createSubscriber('replay'))

//-------------------------------------------------------------------------------

//async subject - always emits it's latest value upon complete - doesn't emit anything until it completes, if subscribed to after completing it still emits it's final value

const apiCall$ = new AsyncSubject();

apiCall$.next(1);

// apiCall$.subscribe(createSubscriber('one'))

apiCall$.next(2);
apiCall$.complete();

// setTimeout(() => {
//   apiCall$.subscribe(createSubscriber('two'))
// }, 2000)

//----------------------------------------------------------------------------------

//hot and cold observable concepts -

//in a hot observable you do not expect to receive historical data you only expect to see data the moment you plug in to that stream - as in a keyup event, we have no expectation of receiving every historical key press

//a cold observable doesn't do anything until it is subscribed to, at which time it delivers all of it's values from start to finish -

//publish allows us to turn a cold observable into a hot one - neither of these subscriptions start the observable, the subscribers will only start to receive values when connect is called on the observable - in this case, ensuring that both subscribers emit the same values at the same time

//a published observable must also be disconnected from to clean itself up - you would create a variable from the connection - const thing = interval$.connect(), thing.unsubscribe()

//type casting as connected observable just keeps typescript from crying when .connect() is applied

const intervalThree$ = interval(1000).pipe(
  take(10),
  publish()
) as ConnectableObservable<number>;

setTimeout(() => {
  intervalThree$.connect();
}, 5000);

// setTimeout(() => {
//   intervalThree$.subscribe(createSubscriber('one'))
// }, 1200)
// setTimeout(() => {
//   intervalThree$.subscribe(createSubscriber('two'))
// }, 3200)

// refCount() will also disconnect a hot observable once all of it's subscribers have unsubscribed

//share() has the exact same behavior as calling publish() then refcount()

//this would be good practice if you have an expensive computation that you want to be run ONCE and then shared amongst a great deal of subscribers - for instance if you're running an interval as a cold observable, every subscription would create another interval vs one interval shared by many subscribers

//------------------------------------------------------------------------------------

//operators -

//finalize() - executes after the observable has emitted it's last value and completed

// from(range(1, 10)).pipe(
//   finalize(() => {
//     console.log('from finally')
//   }),
//   map(a => a * a)
// ).subscribe(createSubscriber('finally'))

//filter - works the same as it does on js arrays

//startWith() - merges in a first value to the observable

//merge and concat -

// merge merges in one observable stream with another - so you get one observable that emits a value every second AND every half second

// interval(1000)
//   .pipe(
//     map(i => `${i} seconds`),
//     merge(interval(500).pipe(map(i => `${i} half seconds`))),
//     take(10)
//   )
//   .subscribe(createSubscriber("mergedInterval"));

//concat - similar to merge but will only merge after the initial observable completes - without the take the first interval would log without end and the second interval would never be merged into the stream

// interval(1000).pipe(
//   map(i => `${i} seconds`),
//   take(3),
//   concat(interval(500).pipe(map(i => `${i} half seconds`))),
//   take(3)
// ).subscribe(
//     createSubscriber("thing")
//   )

//map, mergeMap, switchMap

//map - you know it, you love it

//mergeMap - basically using the values from the first observable to feed into another observable, do some kind of operation and emit values - sort of a highjacking of the stream - a map that returns an observable

// from(range(1, 10)).pipe(
//   mergeMap(i => timer(i * 2000).pipe(
//     map(() => `After ${i * 2} Seconds`)
//   )),
//   take(5)
// ).subscribe(createSubscriber('mergeMap'))

//here we could use mergeMap to take values from one observable and put them into a query to return a promise

// of('my query').pipe(
//   tap(() => console.log('querying')),
//   mergeMap(a => query(a)),
//   tap(() => console.log('after querying'))
// ).subscribe(createSubscriber('query'))

function query(value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`THIS IS THE VALUE - ${value}`)
    }, 3000)
  })
}

//switchMap is just like mergeMap but it cancels previous values if new values come through- only emits latest value - how click event debouncing works/async call would be cancelled value would be discarded if another was initiated

// reduce and scan

// normal js reduce function --

// function arrayReduce(array, accumulator, startValue){
//   let value = startValue;
//   for (let item of array) {
//     value = accumulator(value, item);
//   }
//   return value
// }

//reduce will continue to run until it runs out of values - it is good for cold observables - hot observables should use scan

//reduce will emit a single value when it has completed

// from(range(1, 10)).pipe(
//   reduce((acc, value) => acc + value)
// ).subscribe(createSubscriber('reduce'))

//scan will emit a value on every iteration until it completes

from(range(1, 10)).pipe(
  scan((acc, value) => acc + value)
).subscribe(createSubscriber('reduce'))

//this scan setup will return a current and previous value as [curr, prev] every iteration

from(range(1, 10)).pipe(
  scan(([last], current) => [current, last], [])
).subscribe(createSubscriber('reduce'))

