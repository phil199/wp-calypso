/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { keyBy, reduce, mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import ThemeQueryManager from 'lib/query-manager/theme';
import {
	THEME_REQUEST,
	THEME_REQUEST_SUCCESS,
	THEME_REQUEST_FAILURE,
	THEMES_RECEIVE,
	THEMES_REQUEST,
	THEMES_REQUEST_SUCCESS,
	THEMES_REQUEST_FAILURE,
	SERIALIZE,
	DESERIALIZE
} from 'state/action-types';
import {
	getSerializedThemesQuery
} from './utils';
import { createReducer, isValidStateWithSchema } from 'state/utils';
import { itemsSchema, queriesSchema } from './schema';
import themesUI from './themes-ui/reducer';

/**
 * Tracks all known theme objects, indexed by ID.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Action payload
 * @return {Object}        Updated state
 */
export const items = createReducer( {}, {
	[ THEMES_RECEIVE ]: ( state, action ) => {
		const { siteId } = action;

		const fetchedThemes = keyBy( action.themes, 'id' );
		return { ...state, [ siteId ]: { ...( state[ siteId ] ), ...fetchedThemes } };
	}
}, itemsSchema );

/**
 * Returns the updated site theme requests state after an action has been
 * dispatched. The state reflects a mapping of site ID, theme ID pairing to a
 * boolean reflecting whether a request for the theme is in progress.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Action payload
 * @return {Object}        Updated state
 */
export function siteRequests( state = {}, action ) {
	switch ( action.type ) {
		case THEME_REQUEST:
		case THEME_REQUEST_SUCCESS:
		case THEME_REQUEST_FAILURE:
			return Object.assign( {}, state, {
				[ action.siteId ]: Object.assign( {}, state[ action.siteId ], {
					[ action.themeId ]: THEME_REQUEST === action.type
				} )
			} );

		case SERIALIZE:
		case DESERIALIZE:
			return {};
	}

	return state;
}

/**
 * Returns the updated theme query requesting state after an action has been
 * dispatched. The state reflects a mapping of serialized query to whether a
 * network request is in-progress for that query.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Action payload
 * @return {Object}        Updated state
 */
export function queryRequests( state = {}, action ) {
	switch ( action.type ) {
		case THEMES_REQUEST:
		case THEMES_REQUEST_SUCCESS:
		case THEMES_REQUEST_FAILURE:
			const serializedQuery = getSerializedThemesQuery( action.query, action.siteId );
			return Object.assign( {}, state, {
				[ serializedQuery ]: THEMES_REQUEST === action.type
			} );

		case SERIALIZE:
		case DESERIALIZE:
			return {};
	}

	return state;
}

/**
 * Returns the updated theme query state after an action has been dispatched.
 * The state reflects a mapping of serialized query key to an array of theme IDs
 * for the query, if a query response was successfully received.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Action payload
 * @return {Object}        Updated state
 */
export const queries = ( () => {
	function applyToManager( state, siteId, method, createDefault, ...args ) {
		if ( ! state[ siteId ] ) {
			if ( ! createDefault ) {
				return state;
			}

			return {
				...state,
				[ siteId ]: ( new ThemeQueryManager() )[ method ]( ...args )
			};
		}

		const nextManager = state[ siteId ][ method ]( ...args );
		if ( nextManager === state[ siteId ] ) {
			return state;
		}

		return {
			...state,
			[ siteId ]: nextManager
		};
	}

	return createReducer( {}, {
		[ THEMES_REQUEST_SUCCESS ]: ( state, { siteId, query, themes, found } ) => {
			return applyToManager( state, siteId, 'receive', true, themes, { query, found } );
		},
		[ THEMES_RECEIVE ]: ( state, { themes } ) => {
			const themesBySiteId = reduce( themes, ( memo, theme ) => {
				return Object.assign( memo, {
					[ theme.site_ID ]: [
						...( memo[ theme.site_ID ] || [] ),
						theme
					]
				} );
			}, {} );

			return reduce( themesBySiteId, ( memo, siteThemes, siteId ) => {
				return applyToManager( memo, siteId, 'receive', true, siteThemes );
			}, state );
		},
		[ SERIALIZE ]: ( state ) => {
			return mapValues( state, ( { data, options } ) => ( { data, options } ) );
		},
		[ DESERIALIZE ]: ( state ) => {
			if ( ! isValidStateWithSchema( state, queriesSchema ) ) {
				return {};
			}

			return mapValues( state, ( { data, options } ) => {
				return new ThemeQueryManager( data, options );
			} );
		}
	} );
} )();

export default combineReducers( {
	items,
	siteRequests,
	queryRequests,
	queries,
	themesUI
} );
