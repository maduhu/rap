/*******************************************************************************
 * Copyright (c) 2011, 2012 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

namespace( "rwt.widgets" );

rwt.widgets.Display = function() {
  this._document = rwt.widgets.base.ClientDocument.getInstance();
  this._request = rwt.remote.Server.getInstance();
  this._exitConfirmation = null;
  if( rwt.widgets.Display._current !== undefined ) {
    throw new Error( "Display can not be created twice" );
  } else {
    rwt.widgets.Display._current = this;
  }
};

rwt.widgets.Display.getCurrent = function() {
  return rwt.widgets.Display._current;
};

rwt.widgets.Display.prototype = {

  init : function( args ) {
    this._request.setUrl( args.url );
    this._request.setUIRootId( args.rootId );
    this._request.getMessageWriter().appendHead( "rwt_initialize", true );
    this._appendWindowSize();
    this._appendSystemDPI();
    this._appendColorDepth();
    this._appendInitialHistoryEvent();
    this._attachListener();
    this._request.sendImmediate( true );
  },

  probe : function( args ) {
    org.eclipse.swt.FontSizeCalculation.probe( args.fonts );
  },

  measureStrings : function( args ) {
    org.eclipse.swt.FontSizeCalculation.measureStringItems( args.strings );
  },

  allowEvent : function() {
    // NOTE : in the future might need a parameter if there are multiple types of cancelable events
    org.eclipse.rwt.KeyEventSupport.getInstance().allowEvent();
  },

  cancelEvent : function() {
    org.eclipse.rwt.KeyEventSupport.getInstance().cancelEvent();
  },

  beep : function() {
    // do nothing for now, used by native clients
  },

  /**
   * An exit confirmation dialog will be displayed if the given message is not
   * null. If the message is empty, the dialog will be displayed but without a
   * message.
   */
  setExitConfirmation : function( message ) {
    this._exitConfirmation = message;
  },

  setFocusControl : function( widgetId ) {
    org.eclipse.swt.WidgetManager.getInstance().focus( widgetId );
  },

  setCurrentTheme : function( themeId ) {
    rwt.theme.ThemeStore.getInstance().setCurrentTheme( themeId );
  },

  setEnableUiTests : function( value ) {
    rwt.widgets.base.Widget._renderHtmlIds = value;
  },

  getDPI : function() {
    var result = [ 0, 0 ];
    if( typeof screen.systemXDPI == "number" ) {
      result[ 0 ] = parseInt( screen.systemXDPI, 10 );
      result[ 1 ] = parseInt( screen.systemYDPI, 10 );
    } else {
      var testElement = document.createElement( "div" );
      testElement.style.width = "1in";
      testElement.style.height = "1in";
      testElement.style.padding = 0;
      document.body.appendChild( testElement );
      result[ 0 ] = parseInt( testElement.offsetWidth, 10 );
      result[ 1 ] = parseInt( testElement.offsetHeight, 10 );
      document.body.removeChild( testElement );
    }
    return result;
  },

  ////////////////////////
  // Global Event handling

  _attachListener : function() {
    this._document.addEventListener( "windowresize", this._onResize, this );
    this._document.addEventListener( "keypress", this._onKeyPress, this );
    this._request.addEventListener( "send", this._onSend, this );
    org.eclipse.rwt.KeyEventSupport.getInstance(); // adds global KeyListener
    rwt.runtime.System.getInstance().addEventListener( "beforeunload", this._onBeforeUnload, this );
    rwt.runtime.System.getInstance().addEventListener( "unload", this._onUnload, this );
  },

  _onResize : function( evt ) {
    this._appendWindowSize();
    // Fix for bug 315230
    if( this._request.getRequestCounter() != null ) {
      this._request.send();
    }
  },

  _onKeyPress : function( evt ) {
    if( evt.getKeyIdentifier() == "Escape" ) {
      evt.preventDefault();
    }
  },

  _onSend : function( evt ) {
    // TODO [tb] : This will attach the cursorLocation as the last operation, but should be first
    var pageX = qx.event.type.MouseEvent.getPageX();
    var pageY = qx.event.type.MouseEvent.getPageY();
    var location = [ pageX, pageY ];
    rwt.remote.Server.getInstance().getServerObject( this ).set( "cursorLocation", location );
  },

  _onBeforeUnload : function( event ) {
    if( this._exitConfirmation !== null && this._exitConfirmation !== "" ) {
      event.getDomEvent().returnValue = this._exitConfirmation;
      event.setUserData( "returnValue", this._exitConfirmation );
    }
  },

  _onUnload : function() {
    this._document.removeEventListener( "windowresize", this._onResize, this );
    this._document.removeEventListener( "keypress", this._onKeyPress, this );
    this._request.removeEventListener( "send", this._onSend, this );
  },

  ///////////////////
  // client to server

  _appendWindowSize : function() {
    var width = qx.html.Window.getInnerWidth( window );
    var height = qx.html.Window.getInnerHeight( window );
    var bounds = [ 0, 0, width, height ];
    rwt.remote.Server.getInstance().getServerObject( this ).set( "bounds", bounds );
  },

  _appendSystemDPI : function() {
    var dpi = this.getDPI();
    rwt.remote.Server.getInstance().getServerObject( this ).set( "dpi", dpi );
  },

  _appendColorDepth : function() {
    var depth = 16;
    if( typeof screen.colorDepth == "number" ) {
      depth = parseInt( screen.colorDepth, 10 );
    }
    if( rwt.client.Client.isGecko() ) {
      // Firefox detects 24bit and 32bit as 24bit, but 32bit is more likely
      depth = depth == 24 ? 32 : depth;
    }
    rwt.remote.Server.getInstance().getServerObject( this ).set( "colorDepth", depth );
  },

  _appendInitialHistoryEvent : function() {
    var entryId = window.location.hash;
    if( entryId !== "" ) {
      var server = rwt.remote.Server.getInstance();
      var history = rwt.client.History.getInstance();
      // TODO: Temporary workaround for 388835
      rwt.protocol.ObjectRegistry.add( "bh", history, "rwt.BrowserHistory" );
      server.getServerObject( history ).notify( "historyNavigated", {
        "entryId" : entryId.substr( 1 )
      } );
    }
  }

};