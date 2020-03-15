// why reactive? - why make an observable out of something like an api request when it only ever returns a single value? by modeling something in a reactive way we get access to all the functionality of rxjs - things like easily retrying a request if it fails - we could write one line of code that says if this request fails and it failed because of some transient issue, wait a little and re-query it
// basically modelling things in a reactive way gives us access to all of the benefits of the rxjs library and operators - makes code more declarative and succinct
// start thinking in a push model instead of a push model - we're no longer looping through an array we're essentially saying 'hey object, if you have a new value give it to me'

import { of, interval, fromEvent, Observable } from "rxjs";
import {
  mergeMap,
  flatMap,
  map,
  distinctUntilChanged,
  debounceTime,
  switchMap
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

//observables are lazy, they do not run the generator function until they are subscribed through

//creating an interval observable and custom subscriber function

//what is an operator in rxjs? it's simply an observable that wraps another observable

//an observable is nothing more than a generator function that is invoked every time it is subscribed to

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

const everySecond$ = createInterval$(1000);
const firstFiveSeconds$ = take$(everySecond$, 5)
const subscription = firstFiveSeconds$.subscribe(createSubscriber('one'))

//------------------------------------------------------------------------------