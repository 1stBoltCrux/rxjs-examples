// why reactive? - why make an observable out of something like an api request when it only ever returns a single value? by modeling something in a reactive way we get access to all the functionality of rxjs - things like easily retrying a request if it fails - we could write one line of code that says if this request fails and it failed because of some transient issue, wait a little and re-query it
// basically modelling things in a reactive way gives us access to all of the benefits of the rxjs library and operators - makes code more declarative and succinct
// start thinking in a push model instead of a push model - we're no longer looping through an array we're essentially saying 'hey object, if you have a new value give it to me'

import { of, interval, fromEvent, Observable, timer, from, defer, range, Subject, AsyncSubject, BehaviorSubject } from "rxjs";
import {
  mergeMap,
  flatMap,
  map,
  distinctUntilChanged,
  debounceTime,
  switchMap,
  take,
  tap
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
      console.log(`generating ${index}`)
      observer.next(index++);
    }, time);
    return () => {
      clearInterval(interval)
    }
  })
}

//subscriber logger

function createSubscriber(tag) {
  return {
    next(item) { console.log(`${tag}.next ${item}`)},
    error(error) { console.log(`${tag}.error ${error.stack || error}`)},
    complete() {console.log('complete')}
  }
}

// a customized take operator - 

function take$(sourceObservable$, amount) {
  return new Observable(observer => {
    let count = 0;
    const subscription = sourceObservable$.subscribe({
      next(item) {
        observer.next(item);
        if (++count >= amount){
          observer.complete()
        }
      },
      error(error) {observer.error(error)},
      complete() {observer.complete()}
    });

    return () => {
      subscription.unsubscribe()
    }
  })
}

// const everySecond$ = createInterval$(1000);
// const firstFiveSeconds$ = take$(everySecond$, 5)
// const subscription = firstFiveSeconds$.subscribe(createSubscriber('one'))

//------------------------------------------------------------------------------

//interval observable that emits every half a second, five times

const interval$ = interval(500).pipe(
  take(5)
)

// interval$.subscribe(createSubscriber('interval'))

//waits 3 seconds, then begins emitting values every second (second param is a period value) - the value being emitted is the index of the timer, or the emission count, so 0, 1, 2, etc....

const timer$ = timer(3000, 1000)

// timer$.subscribe(createSubscriber('timer'))


//wraps a value into an observable - emits arguments in order and then completes

const of$ = of('hello world', 'thingy', 'banana')

// of$.subscribe(createSubscriber('of'))

//takes an array-like value and flattens it - from always expects an iterable - it will iterate over and pass each item as it's next value - this would emit 'hello' and then next it would emit 'world' - if you were to pass a string every character would be emitted one at a time as the next value - great way to take an existing array and perform actions on each item

const from$ = from(['hello', 'world'])

// from$.subscribe(createSubscriber('from'))

//defer creates a generator function and invokes the function every time it is subscribed to

let sideEffect = 0;
const defer$ = defer(() => {
  sideEffect++;
  return of(sideEffect);
})

// defer$.subscribe(createSubscriber('1'))
// defer$.subscribe(createSubscriber('2'))
// defer$.subscribe(createSubscriber('3'))

//emits values one by one through the selected range - doesn't work like python's range method - the first argument is the starting point and the second argument is how far to count up from that first argument - also it's not inclusive so you get 10 - 39 as values

const range$ = range(10, 30)

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
  tap(thing => console.log('log me')),
  take(5)
)
const intervalSubject$ = new Subject()
intervalTwo$.subscribe(intervalSubject$)

intervalSubject$.subscribe(createSubscriber('sub1'))
intervalSubject$.subscribe(createSubscriber('sub2'))
intervalSubject$.subscribe(createSubscriber('sub3'))