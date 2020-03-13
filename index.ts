import { of, interval, fromEvent } from "rxjs";
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
