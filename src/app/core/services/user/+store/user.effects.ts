import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { asyncScheduler, EMPTY as empty, of } from 'rxjs';
import {
  catchError,
  concatMap,
  debounceTime,
  map,
  skip,
  switchMap,
  takeUntil
} from 'rxjs/operators';

import * as UserActions from '@app/core/services/user/+store/user.actions';
import { User } from '@app/core/services/user/models/user.interface';
import { UserService } from '@app/core/services/user/services/user.service';

@Injectable()
export class UserEffects {
  constructor(private actions$: Actions, private userService: UserService) {}

  public getUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.getUser),
      map(action => action),
      concatMap(action =>
        this.userService.getById(action.id).pipe(
          map((response: User) => UserActions.getUserSuccess({ response })),
          catchError(error => of(UserActions.getUserFail(error)))
        )
      )
    )
  );

  public search$ = createEffect(() => ({ debounce = 300, scheduler = asyncScheduler } = {}) =>
    this.actions$.pipe(
      ofType(UserActions.search),
      debounceTime(debounce, scheduler),
      switchMap(({ name }) => {
        if (name === null) {
          return empty;
        }

        const nextSearch$ = this.actions$.pipe(ofType(UserActions.search), skip(1));

        return this.userService.search().pipe(
          takeUntil(nextSearch$),
          map((data: User[]) => data.filter(u => u.name.toLowerCase().indexOf(name) > -1)),
          map((users: User[]) => UserActions.searchSuccess({ response: users })),
          catchError((error: any) => of(UserActions.searchFail({ error })))
        );
      })
    )
  );
}
