/**
 * External dependencies
 */
var	page = require( 'page' );

/**
 * Internal dependencies
 */
var config = require( 'config' ),
	controller = require( 'my-sites/controller' ),
	settingsController = require( './controller' );

module.exports = function() {
	page( '/settings', controller.siteSelection, settingsController.redirectToGeneral );
	page( '/settings/general/:site_id', controller.siteSelection, controller.navigation, settingsController.setScroll, settingsController.siteSettings );
	page( '/settings/writing/:site_id', controller.siteSelection, controller.navigation, settingsController.setScroll, settingsController.siteSettings );
	page( '/settings/discussion/:site_id', controller.siteSelection, controller.navigation, settingsController.setScroll, settingsController.siteSettings );
	page( '/settings/analytics/:site_id', controller.siteSelection, controller.navigation, settingsController.setScroll, settingsController.siteSettings );
	page( '/settings/security/:site_id', controller.siteSelection, controller.navigation, settingsController.setScroll, settingsController.siteSettings );

	page( '/settings/import/:site_id', controller.siteSelection, controller.navigation, settingsController.importSite );

	if ( config.isEnabled( 'manage/export/guided-transfer' ) ) {
		page( '/settings/export/guided/:host_slug?/:site_id', controller.siteSelection, controller.navigation, settingsController.guidedTransfer );
	}

	if ( config.isEnabled( 'manage/export' ) ) {
		page( '/settings/export/:site_id', controller.siteSelection, controller.navigation, settingsController.exportSite );
	}

	if ( config.isEnabled( 'manage/site-settings/delete-site' ) ) {
		page( '/settings/delete-site/:site_id', controller.siteSelection, controller.navigation, settingsController.setScroll, settingsController.deleteSite );
		page( '/settings/start-over/:site_id', controller.siteSelection, controller.navigation, settingsController.setScroll, settingsController.startOver );
	}

	if ( config.isEnabled( 'manage/site-settings/categories' ) ) {
		page( '/settings/taxonomies/:site_id/:taxonomy', controller.siteSelection, controller.navigation, settingsController.setScroll, settingsController.taxonomies );
	}

	page( '/settings/:section', settingsController.legacyRedirects, controller.siteSelection, controller.sites );
};
