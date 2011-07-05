/*******************************************************************************
 * Copyright (c) 2011 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/
package org.eclipse.rwt.internal.protocol.util;

import java.util.Arrays;

import junit.framework.TestCase;

import org.eclipse.rwt.Fixture;
import org.eclipse.rwt.internal.protocol.ProtocolMessageWriter;
import org.eclipse.rwt.internal.protocol.util.Message.*;


public class Message_Test extends TestCase {
  
  private ProtocolMessageWriter writer;

  @Override
  protected void setUp() throws Exception {
    Fixture.setUp();
    writer = new ProtocolMessageWriter();
  }
  
  @Override
  protected void tearDown() throws Exception {
    Fixture.tearDown();
  }
  
  public void testGetOperation() {
    writer.appendDo( "w2", "method", null );
    
    assertNotNull( getMessage().getOperation( 0 ) );
  }
  
  public void testGetCreateOperation() {
    Object[] parameters = new Object[] { "a", new Integer( 2) };
    writer.appendCreate( "w1", "w0", "type", new String[] { "FOO" }, parameters );
    
    assertTrue( getMessage().getOperation( 0 ) instanceof CreateOperation );
  }
  
  public void testGetDoOperation() {
    writer.appendDo( "w2", "method", null );
    
    assertTrue( getMessage().getOperation( 0 ) instanceof DoOperation );
  }

  public void testGetSetOperation() {
    writer.appendSet( "w1", "key", true );
    
    assertTrue( getMessage().getOperation( 0 ) instanceof SetOperation );
  }
  
  public void testGetListenOperation() {
    writer.appendListen( "w1", "event", true );
    
    assertTrue( getMessage().getOperation( 0 ) instanceof ListenOperation );
  }
  
  public void testGetExecuteScriptOperation() {
    writer.appendExecuteScript( "w1", "java", "content" );
    
    assertTrue( getMessage().getOperation( 0 ) instanceof ExecuteScriptOperation );
  }
  
  public void testGetDestroyOperation() {
    writer.appendDestroy( "w1" );
    
    assertTrue( getMessage().getOperation( 0 ) instanceof DestroyOperation );
  }
  
  public void testCreateOperation() {
    Object[] parameters = new Object[] { "a", new Integer( 2 ) };
    String[] styles = new String[] { "FOO", "BAR" };
    writer.appendCreate( "w1", "w0", "type", styles, parameters );
    
    CreateOperation operation = ( CreateOperation )getMessage().getOperation( 0 );
    assertEquals( "w1", operation.getTarget() );
    assertEquals( "w0", operation.getParent() );
    assertEquals( "type", operation.getType() );
    assertArrayEquals( styles, operation.getStyles() );
    assertArrayEquals( parameters, operation.getParameters() );
  }
  
  public void testDoOperation() {
    Object[] parameters = new Object[] { "a", new Integer( 2 ) };
    writer.appendDo( "w2", "method", parameters );
    
    DoOperation operation = ( DoOperation )getMessage().getOperation( 0 );
    assertEquals( "w2", operation.getTarget() );
    assertEquals( "method", operation.getName() );
    assertArrayEquals( parameters, operation.getParameters() );
  }
  
  public void testSetOperation() {
    writer.appendSet( "w1", "key", true );
    writer.appendSet( "w1", "key2", "value" );
    
    SetOperation operation = ( SetOperation )getMessage().getOperation( 0 );
    assertEquals( "w1", operation.getTarget() );
    assertEquals( Boolean.TRUE, operation.getProperty( "key" ) );
    assertEquals( "value", operation.getProperty( "key2" ) );
  }
  
  public void testListenOperation() {
    writer.appendListen( "w1", "event", true );
    writer.appendListen( "w1", "event2", false );
    
    ListenOperation operation = ( ListenOperation )getMessage().getOperation( 0 );
    assertEquals( true, operation.listensTo( "event" ) );
    assertEquals( false, operation.listensTo( "event2" ) );
  }
  
  public void testExecuteScriptOperation() {
    writer.appendExecuteScript( "w1", "java", "content" );
    
    ExecuteScriptOperation operation = ( ExecuteScriptOperation )getMessage().getOperation( 0 );
    assertEquals( "java", operation.getScriptType() );
    assertEquals( "content", operation.getScript() );
  }
  
  public void testWithTwoOperations() {
    writer.appendDestroy( "w3" );
    writer.appendExecuteScript( "w1", "java", "content" );
    
    ExecuteScriptOperation operation = ( ExecuteScriptOperation )getMessage().getOperation( 1 );
    assertEquals( "java", operation.getScriptType() );
    assertEquals( "content", operation.getScript() );
  }
  
  public void testNonExistingValue() {
    writer.appendSet( "w1", "key", true );
    
    SetOperation operation = ( SetOperation )getMessage().getOperation( 0 );
    try {
      operation.getProperty( "key2" );
      fail();
    } catch ( IllegalStateException expected ) {
    }
  }
  
  public void testNonExistingOperation() {
    writer.appendSet( "w1", "key", true );
    
    try {
      getMessage().getOperation( 1 );
      fail();
    } catch ( IllegalStateException expected ) {
    }
  }
  
  private Message getMessage() {
    return new Message( writer.createMessage() );
  }
  
  // TODO: Move to Fixture
  private void assertArrayEquals( Object[] expected, Object[] actual ) {
    if( !Arrays.equals( expected, actual ) ) {
      fail( "Expected:\n" + expected + "\n but was:\n" + actual );
    }
  }
}
