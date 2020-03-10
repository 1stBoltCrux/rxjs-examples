import { of, interval } from 'rxjs'; 
import { mergeMap, flatMap, map } from 'rxjs/operators';

const letters = of('a', 'b', 'c');

//interval returns a counter for each tick, so 1, 2, 3, etc

const result = letters.pipe(
  flatMap(
    x => interval(1000).pipe(
      map(i => {
        console.log(x)
       return x + i
      } )
      )
    )
)

result.subscribe( x => console.log(x))
