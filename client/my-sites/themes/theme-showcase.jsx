/**
 * External dependencies
 */
import React, { PropTypes } from 'react';
import { localize } from 'i18n-calypso';
import { compact, pickBy } from 'lodash';

/**
 * Internal dependencies
 */
import Main from 'components/main';
import ThemePreview from './theme-preview';
import ThemesSelection from './themes-selection';
import PageViewTracker from 'lib/analytics/page-view-tracker';
import { addTracking } from './helpers';
import DocumentHead from 'components/data/document-head';
import config from 'config';

const themesMeta = {
	'': {
		title: 'WordPress Themes',
		description: 'Beautiful, responsive, free and premium WordPress themes \
			for your photography site, portfolio, magazine, business website, or blog.',
		canonicalUrl: 'https://wordpress.com/design',
	},
	free: {
		title: 'Free WordPress Themes',
		description: 'Discover Free WordPress Themes on the WordPress.com Theme Showcase.',
		canonicalUrl: 'https://wordpress.com/design/free',
	},
	premium: {
		title: 'Premium WordPress Themes',
		description: 'Discover Premium WordPress Themes on the WordPress.com Theme Showcase.',
		canonicalUrl: 'https://wordpress.com/design/premium',
	}
};

const optionShape = PropTypes.shape( {
	label: PropTypes.string,
	header: PropTypes.string,
	getUrl: PropTypes.func,
	action: PropTypes.func
} );

const ThemeShowcase = React.createClass( {
	propTypes: {
		tier: PropTypes.oneOf( [ '', 'free', 'premium' ] ),
		// Connected props
		options: PropTypes.objectOf( optionShape ),
		defaultOption: optionShape,
		secondaryOption: optionShape,
		getScreenshotOption: PropTypes.func,
	},

	getDefaultProps() {
		return {
			selectedSite: false,
			tier: ''
		};
	},

	getInitialState() {
		return {
			page: 0,
			showPreview: false,
			previewingTheme: null,
		};
	},

	togglePreview( theme ) {
		this.setState( { showPreview: ! this.state.showPreview, previewingTheme: theme } );
	},

	onPrimaryPreviewButtonClick( theme ) {
		const option = this.getPrimaryOption();
		this.setState( { showPreview: false }, () => {
			option.action && option.action( theme );
		} );
	},

	onSecondaryPreviewButtonClick( theme ) {
		const { secondaryOption } = this.props;
		this.setState( { showPreview: false }, () => {
			secondaryOption && secondaryOption.action ? secondaryOption.action( theme ) : null;
		} );
	},

	getPrimaryOption() {
		if ( ! this.state.showPreview ) {
			return this.props.defaultOption;
		}
		const { translate } = this.props;
		const { purchase, activate } = this.props.options;
		const { price } = this.state.previewingTheme;
		let primaryOption = this.props.defaultOption;
		if ( price && purchase ) {
			primaryOption = purchase;
			primaryOption.label = translate( 'Pick this design' );
		} else if ( activate ) {
			primaryOption = activate;
			primaryOption.label = translate( 'Activate this design' );
		}
		return primaryOption;
	},

	addVerticalToFilters() {
		const { vertical, filter } = this.props;
		return compact( [ filter, vertical ] ).join( ',' );
	},

	incrementPage() {
		this.setState( { page: this.state.page + 1 } );
	},

	render() {
		const { options, getScreenshotOption, secondaryOption, search } = this.props;
		const tier = config.isEnabled( 'upgrades/premium-themes' ) ? this.props.tier : 'free';
		const primaryOption = this.getPrimaryOption();

		// If a preview action is passed, use that. Otherwise, use our own.
		if ( options.preview && ! options.preview.action ) {
			options.preview.action = theme => this.togglePreview( theme );
		}

		const metas = [
			{ name: 'description', property: 'og:description', content: themesMeta[ tier ].description },
			{ property: 'og:url', content: themesMeta[ tier ].canonicalUrl },
			{ property: 'og:type', content: 'website' }
		];

		const query = {
			search,
			tier,
			filter: this.addVerticalToFilters(),
			page: this.state.page,
			number: 20
		};

		// FIXME: Logged-in title should only be 'Themes'
		return (
			<Main className="themes">
				<DocumentHead title={ themesMeta[ tier ].title } meta={ metas } />
				<PageViewTracker path={ this.props.analyticsPath } title={ this.props.analyticsPageTitle } />
				{ this.props.children }
				{ this.state.showPreview &&
					<ThemePreview showPreview={ this.state.showPreview }
						theme={ this.state.previewingTheme }
						onClose={ this.togglePreview }
						primaryButtonLabel={ primaryOption.label }
						getPrimaryButtonHref={ primaryOption.getUrl }
						onPrimaryButtonClick={ this.onPrimaryPreviewButtonClick }
						secondaryButtonLabel={ secondaryOption ? secondaryOption.label : null }
						getSecondaryButtonHref={ secondaryOption ? secondaryOption.getUrl : null }
						onSecondaryButtonClick={ this.onSecondaryPreviewButtonClick }
					/>
				}
				<ThemesSelection query={ query }
					siteId={ this.props.siteId }
					selectedSite={ this.props.selectedSite }
					getScreenshotUrl={ function( theme ) {
						if ( ! getScreenshotOption( theme ).getUrl ) {
							return null;
						}
						return getScreenshotOption( theme ).getUrl( theme );
					} }
					onScreenshotClick={ function( theme ) {
						if ( ! getScreenshotOption( theme ).action ) {
							return;
						}
						getScreenshotOption( theme ).action( theme );
					} }
					getActionLabel={ function( theme ) {
						return getScreenshotOption( theme ).label;
					} }
					getOptions={ function( theme ) {
						return pickBy(
							addTracking( options ),
							option => ! ( option.hideForTheme && option.hideForTheme( theme ) )
						); } }
					trackScrollPage={ this.props.trackScrollPage }
					tier={ this.props.tier }
					filter={ this.props.filter }
					vertical={ this.props.vertical }
					incrementPage={ this.incrementPage } />
			</Main>
		);
	}
} );

export default localize( ThemeShowcase );
