/** @ssr-ready **/

/**
 * Internal dependencies
 */
import wpcom from 'lib/wp';
import {
	THEME_REQUEST,
	THEME_REQUEST_SUCCESS,
	THEME_REQUEST_FAILURE,
	THEMES_RECEIVE,
	THEMES_REQUEST,
	THEMES_REQUEST_SUCCESS,
	THEMES_REQUEST_FAILURE,
	THEME_ACTIVATE_REQUEST,
	THEME_ACTIVATE_REQUEST_SUCCESS,
	THEME_ACTIVATE_REQUEST_FAILURE,
	THEMES_RECEIVE_SERVER_ERROR,
} from 'state/action-types';
import {
	recordTracksEvent,
	withAnalytics
} from 'state/analytics/actions';
import { getCurrentTheme } from './current-theme/selectors';
import { getThemeById } from './themes/selectors';

/**
 * Returns an action object to be used in signalling that a theme object has
 * been received.
 *
 * @param  {Object} theme Theme received
 * @return {Object}      Action object
 */
export function receiveTheme( theme ) {
	return receiveThemes( [ theme ] );
}

/**
 * Returns an action object to be used in signalling that theme objects have
 * been received.
 *
 * @param  {Array}  themes Themes received
 * @return {Object}       Action object
 */
export function receiveThemes( themes ) {
	return {
		type: THEMES_RECEIVE,
		themes
	};
}

/**
 * Triggers a network request to fetch themes for the specified site and query.
 *
 * @param  {?Number}  siteId    Site ID
 * @param  {Boolean}  isJetpack If the site is a Jetpack site
 * @param  {String}   query     Theme query
 * @return {Function}           Action thunk
 */
export function requestThemes( siteId, isJetpack = false, query = {} ) {
	return ( dispatch ) => {
		let siteIdToQuery, siteIdToStore, queryWithApiVersion;

		if ( isJetpack ) {
			siteIdToQuery = siteId;
			siteIdToStore = siteId;
			queryWithApiVersion = { ...query, apiVersion: '1' };
		} else {
			siteIdToQuery = null;
			siteIdToStore = 'wpcom'; // Themes for all wpcom sites go into 'wpcom' subtree
			queryWithApiVersion = { ...query, apiVersion: '1.2' };
		}

		dispatch( {
			type: THEMES_REQUEST,
			siteId: siteIdToStore,
			query
		} );

		return wpcom.undocumented().themes( siteIdToQuery, queryWithApiVersion ).then( ( { found, themes } ) => {
			dispatch( receiveThemes( themes ) );
			dispatch( {
				type: THEMES_REQUEST_SUCCESS,
				siteId: siteIdToStore,
				query,
				found,
				themes
			} );
		} ).catch( ( error ) => {
			dispatch( {
				type: THEMES_REQUEST_FAILURE,
				siteId: siteIdToStore,
				query,
				error
			} );
		} );
	};
}

/**
 * Triggers a network request to fetch a specific theme from a site.
 *
 * @param  {Number}   themeId Theme ID
 * @param  {Number}   siteId Site ID
 * @param  {Boolean}  isJetpack If the site is a Jetpack site
 * @return {Function}        Action thunk
 */
export function requestTheme( themeId, siteId, isJetpack = false ) {
	return ( dispatch ) => {
		let siteIdToQuery, siteIdToStore;

		if ( isJetpack ) {
			siteIdToQuery = siteId;
			siteIdToStore = siteId;
		} else {
			siteIdToQuery = null;
			siteIdToStore = 'wpcom'; // Themes for all wpcom sites go into 'wpcom' subtree
		}

		dispatch( {
			type: THEME_REQUEST,
			siteId: siteIdToStore,
			themeId
		} );

		return wpcom.undocumented().themeDetails( themeId, siteIdToQuery ).then( ( theme ) => {
			dispatch( receiveTheme( theme ) );
			dispatch( {
				type: THEME_REQUEST_SUCCESS,
				siteId: siteIdToStore,
				themeId
			} );
		} ).catch( ( error ) => {
			dispatch( {
				type: THEME_REQUEST_FAILURE,
				siteId: siteIdToStore,
				themeId,
				error
			} );
		} );
	};
}

export function receiveServerError( error ) {
	return {
		type: THEMES_RECEIVE_SERVER_ERROR,
		error: error
	};
}

export function activateTheme( themeId, siteId, source = 'unknown', purchased = false ) {
	return dispatch => {
		dispatch( {
			type: THEME_ACTIVATE_REQUEST,
			themeId,
			siteId,
		} );

		return wpcom.undocumented().activateTheme( themeId, siteId )
			.then( ( theme ) => {
				dispatch( themeActivated( theme, siteId, source, purchased ) );
			} )
			.catch( error => {
				dispatch( {
					type: THEME_ACTIVATE_REQUEST_FAILURE,
					themeId,
					siteId,
					error,
				} );
			} );
	};
}

export function themeActivated( theme, siteId, source = 'unknown', purchased = false ) {
	const themeActivatedThunk = ( dispatch, getState ) => {
		if ( typeof theme !== 'object' ) {
			theme = getThemeById( getState(), theme );
		}

		const action = {
			type: THEME_ACTIVATE_REQUEST_SUCCESS,
			theme,
			siteId,
		};
		const previousTheme = getCurrentTheme( getState(), siteId );
		const queryParams = getState().themes.themesList.get( 'query' );

		const trackThemeActivation = recordTracksEvent(
			'calypso_themeshowcase_theme_activate',
			{
				theme: theme.id,
				previous_theme: previousTheme.id,
				source: source,
				purchased: purchased,
				search_term: queryParams.get( 'search' ) || null
			}
		);
		dispatch( withAnalytics( trackThemeActivation, action ) );
	};
	return themeActivatedThunk; // it is named function just for testing purposes
}
