/**
    Author: Mart Civil
    Email: mcivil@salesforce.com
    Date: April 12, 2017    Updated: Sept 6, 2019
    Apollo11 Javascript Utility (utility lite version)
    v 2.0.1
**/
(( $window, $document, $parent ) => {
    `use strict`;
    
    if ( typeof $window.apollo11 !== `undefined` ) {
        console.error( `Apollo11 has already been initialized`, `ERROR` )
        return
    }

    $window.apollo11 = (() => {

        const init = fn => {
            if ( _INTERNAL_DATA.isInit ) {
                return;
            }
            _INTERNAL_DATA.isInit = true
            if ( fn ) {
                launch( fn )
            }
            forEvery( _INTERNAL_DATA.initFns, initFn => {
                launch( initFn )
            })
            delete _INTERNAL_DATA.initFns
        }

        const onLaunch = (fn, timeout) => {
            if ( $document.readyState === `complete` || ( $document.readyState !== `loading` && !$document.documentElement.doScroll ) ) {
                launch(fn, timeout)
            } else {
                _INTERNAL_DATA.initFns.push( ()=>{launch(fn, timeout)} )
            }
        }

        const launch = (fn, timeout) => {
            return (timeout||timeout>0) ? $window.setTimeout( fn, timeout ) : $window.requestAnimationFrame( fn )
        }

        const pulsate = (fn, timeout = 100) => {
            //return (timeout||timeout>0) ? $window.setTimeout( fn, timeout ) : $window.requestAnimationFrame( fn )
            return $window.setInterval( fn, timeout)
        }

        const silentlaunch = (fn, timeout) => {
            return $window.requestIdleCallback( fn, timeout )
        }

        const isUndefined =  param => {
            return typeof param === `undefined`
        }

        const getNearestElement = ( param, type = 'CLASS', loc ) => {
            loc = loc || $document
            let _nodes = []
            let isFound = false
            let hasChildren = false
            const _get = nodes => {
                forEvery( nodes, node => {
                    if( node.nodeType == 1 ) {
                        hasChildren = true
                        switch ( type.toUpperCase() ) {
                            case `CLASS`:
                                if( node.classList.contains( param ) ) {
                                    isFound = true
                                    _nodes.push( node )
                                }
                            break
                        }
                    }
                    
                })
                if( hasChildren && !isFound ) {
                    forEvery( nodes, node => {
                        _get( node.childNodes )
                    })
                }
            }
            _get(loc.childNodes)
            return _nodes
        }

        const getElement = ( param, type = 'CLASS', loc ) => {
            loc = loc || $document
            switch ( type.toUpperCase() ) {
                default:
                case `CLASS`:
                    return loc.getElementsByClassName( param )
                    break
                case `ID`:
                    return loc.getElementById( param )
                    break
                case `TAG`:
                    return loc.getElementsByTagName( param )
                    break
                case `DATA`:
                    if( Object.prototype.toString.call( param ) === `[object String]` ) {
                        return loc.querySelectorAll( `[data-${param}]` )
                    } else if ( Object.prototype.toString.call( param ) === `[object Object]` ) {
                        let _str = ``
                        forEveryKey( param, ( value, key ) => {
                            _str += `[data-${key}='${value}']`
                        })
                        if( _str.length > 0 ) {
                            return loc.querySelectorAll( _str )
                        }
                    }
                    break
                case `SELECT`:
                    return loc.querySelector( param )
                    break
                case `ALL`:
                    return loc.querySelectorAll( param )
                    break
            }
        }

        const keygen = (( length ) => {
            let _keygen       = ''
            const VALIDCHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            for ( var i = 0; i < length; i++ ) {
                _keygen += VALIDCHARS.charAt( Math.floor( Math.random() * VALIDCHARS.length ) )
            }
            return _keygen
        })

        const forEvery = ( param, fn ) => {
            if ( isUndefined( param ) || isUndefined( fn ) ) {
                return;
            }
                        
            if ( Object.prototype.toString.call( param ) === `[object Object]` ) {
                //Aura registers HTMLCollection as Object rather than array
                if( isLightning() ) {
                    if( param.length == 0) {
                        //console.warn(`[WARNING] Lightning Aura treats HTMLCollection as object. Check apollo11 code to debug`, param)
                        return;
                    }
                    let _temp = Array.prototype.slice.call( param, 0 )
                    if( _temp.length > 0 ) {
                        param = _temp
                    } else {
                        param = [param]
                    }
                } else {
                     param = [param]
                }
            }  else if ( Object.prototype.toString.call( param ) === `[object Number]` ) {
                let _param = []
                for( let j = 1; j <= param; j++ ) {
                    _param.push( j )
                }
                param = _param
            } else if ( Object.prototype.toString.call( param ) !== `[object Array]` ) {
                param = Array.prototype.slice.call( param, 0 )
            }

            let _return
            param.some(( val,  i ) => {
                if ( isUndefined( val ) ) {
                    return false
                }
                _return = fn( val, i )
                if ( !isUndefined( _return ) ) {
                    return true
                }
            })
            return _return || false
        }

        const forEveryKey = ( param, fn ) => {
            if ( isUndefined( param ) || isUndefined( fn ) ) {
                return
            }
            let _return
            forEvery( Object.keys( param ),  val => {
                _return = fn( param[ val ], val )
                if ( !isUndefined( _return ) ) {
                    return true
                }
            })
            return _return || false
        }

        const loadResource = ( filename, filetype, fn ) => {
            let fileref
            filetype = ( filetype || filename.substring( filename.lastIndexOf( "." ) + 1, filename.length ) ).toLowerCase()
    
            let resource = _isResourceExists( filename, filetype )
            if ( resource ) {
                console.log( filename + " already exists" , "ERROR" )
            } else {
                if ( filetype === "js" ) {
                    fileref = $document.createElement( "script" )
                    fileref.setAttribute( "type", "text/javascript" )
                    fileref.setAttribute( "src" , filename )
                } else if ( filetype === "css" ) {
                    fileref = $document.createElement( "link" )
                    fileref.setAttribute( "rel", "stylesheet" )
                    fileref.setAttribute( "type", "text/css" )
                    fileref.setAttribute( "href", filename )
                }
                fileref.setAttribute( "async", "" )
                //add the resources to the body of the document instead of the head
                //getElement( "head", "TAG" )[ 0 ].appendChild( fileref );
                $document.body.appendChild( fileref )
                if ( !isUndefined( fn ) ) {
                    addOneTimeEventListener( fileref, "load", () => {
                        fn( fileref )
                    })
                }
            }
        }

        const mergeJSON = ( obj1, obj2, isBackupDuplicate ) => {
            let obj3 = {}
            forEveryKey( obj2, ( value, key ) => {
                obj3[ key ] = value
            })
            forEveryKey( obj1, ( value, key ) => {
                if ( isBackupDuplicate ) {
                    if ( obj3.hasOwnProperty( key ) ) {
                        obj3[ `${key}__super` ] = obj3[ key ]
                    }
                }
                obj3[ key ] = value
            })
            return obj3
        }

        const prependJSONDOM = ( param, loc ) => {
            return _insertJSONDOM( param, loc, `prependDOM` )
        }

        const appendJSONDOM = ( param, loc, fn ) => {
            _insertJSONDOM( param, loc, `appendDOM` ).then( DOM => {
                if( fn ) {
                    ( DOM.length > 1)?fn( DOM ):fn( DOM[ 0 ] )
                }
            }, reject => {
                console.error("Failed to generate DOM")
            })
        }

        const JSONtoDOM =  data => {
            return new Promise( ( resolve, reject ) => {
                let dom
                if ( isUndefined( data[ `tag` ] ) ) {
                    console.log( `Must contain tag parameter`, `ERROR` )
                    console.log( data )
                    reject( `Must contain tag parameter` )
                }
                if( !isUndefined( data[ `namespace` ] ) ) {
                    dom = $document.createElementNS( _INTERNAL_DATA.namespaceURI[ data[ `namespace` ] ], data[ `tag` ].toLowerCase()  )
                } else {
                    dom = $document.createElement( data[ `tag` ].toLowerCase() )
                }

                const generateDOM = () => {
                    forEveryKey( data, ( value, key ) => {
                        switch( key ) {
                            case `tag`:
                            case `namespace`:
                                break
                            case `class`:
                                if ( Object.prototype.toString.call( value ) === `[object String]`  ) {
                                    value = value.split(` `)
                                }
                                forEvery( value, _class => {
                                    if ( _class === `` ) {
                                        return;
                                    }
                                    dom.classList.add( _class )
                                })
                                break
                            case `data`:
                                forEvery( value, data => {
                                    forEveryKey( data, ( value2, key2 ) => {
                                        dom.dataset[key2] = ( Object.prototype.toString.call( value2 ) === `[object Object]` ) ? JSON.stringify( value2 ) : value2
                                    })
                                })
                                break
                            case `children`:
                                break
                            case `style`:
                                dom.setAttribute( key , value )
                                break
                            case `text`:
                                dom.textContent = value
                                break
                            case `events`:
                                forEveryKey( value, ( value2, key2 ) => {
                                    dom.addEventListener( key2, value2 )
                                })
                                break
                            case `html`:
                                dom.innerHTML = value
                                break
                            case `xlink`:
                                forEveryKey( value, ( value2, key2 ) => {
                                    dom.setAttributeNS( _INTERNAL_DATA.namespaceURI[ key ], key2, value2 )
                                })
                                break
                            default:
                                dom.setAttribute( key , value )
                                break
                        }
                    })
                    resolve( dom )
                }

                let _children = (data[`children`])?JSON.parse(JSON.stringify(data[`children`])):undefined
                if( _children ) {
                    if( Object.prototype.toString.call( _children ) !== `[object Array]` ) {
                        _children = [_children]
                    }
                }
                const generateChildren = () => {
                    if( !_children ) { generateDOM(); return }
                    let _child = _children.shift()
                    if( _child ) {
                        _insertJSONDOM( _child, dom, `appendDOM` ).then( result => {
                            generateChildren()
                        })
                    } else {
                        generateDOM() 
                    }
                }
                generateChildren()
            })
        }

        // const JSONtoDOM2 =  data => {
        //     return new Promise( ( resolve, reject ) => {
        //         let dom
        //         if ( isUndefined( data[ `tag` ] ) ) {
        //             console.log( `Must contain tag parameter`, `ERROR` )
        //             console.log( data )
        //             reject( `Must contain tag parameter` )
        //         }
        //         if( !isUndefined( data[ `namespace` ] ) ) {
        //             dom = $document.createElementNS( _INTERNAL_DATA.namespaceURI[ data[ `namespace` ] ], data[ `tag` ].toLowerCase()  )
        //         } else {
        //             dom = $document.createElement( data[ `tag` ].toLowerCase() )
        //         }

        //         forEveryKey( data, ( value, key ) => {
        //             switch( key ) {
        //                 case `tag`:
        //                 case `namespace`:
        //                     break
        //                 case `class`:
        //                     if ( Object.prototype.toString.call( value ) === `[object String]`  ) {
        //                         value = value.split(` `)
        //                     }
        //                     forEvery( value, _class => {
        //                         if ( _class === `` ) {
        //                             return;
        //                         }
        //                         dom.classList.add( _class )
        //                     })
        //                     break
        //                 case `data`:
        //                     forEvery( value, data => {
        //                         forEveryKey( data, ( value2, key2 ) => {
        //                             dom.dataset[key2] = ( Object.prototype.toString.call( value2 ) === `[object Object]` ) ? JSON.stringify( value2 ) : value2
        //                         })
        //                     })
        //                     break
        //                 case `style`:
        //                     dom.setAttribute( key , value )
        //                     break
        //                 case `text`:
        //                     dom.textContent = value
        //                     break
        //                 case `children`:
        //                     forEvery( value, ( child ) => {
        //                         _insertJSONDOM( child, dom, `appendDOM` )
        //                     })
        //                     break
        //                 case `events`:
        //                     forEveryKey( value, ( value2, key2 ) => {
        //                         dom.addEventListener( key2, value2 )
        //                     })
        //                     break
        //                 case `html`:
        //                     dom.innerHTML = value
        //                     break
        //                 case `xlink`:
        //                     forEveryKey( value, ( value2, key2 ) => {
        //                         dom.setAttributeNS( _INTERNAL_DATA.namespaceURI[ key ], key2, value2 )
        //                     })
        //                     break
        //                 default:
        //                     dom.setAttribute( key , value )
        //                     break
        //             }
        //         })
        //         resolve( dom )
        //     })
        // }

        const prependDOM = ( child, parent, fn ) => {
            return new Promise( ( resolve, reject ) => {
                parent = parent || getParent( child )

                if ( !parent.firstChild ) {
                    return appendDOM( child, parent, fn )
                } else {
                    // if( isLightning()) {
                    //     addOneTimeEventListener( parent, `DOMNodeInserted`, ()=>{
                    //         if(fn){
                    //             fn(child)
                    //         }
                    //         resolve( child )
                    //     })
                    // } else {
                          const observer = new MutationObserver( mutations => {
                          mutations.forEach( mutation => {
                            if ( mutation.type === `childList` && mutation.addedNodes.length > 0) {
                                if(fn){
                                    fn(child)
                                }
                                observer.disconnect()
                                resolve( child )
                            }
                          })    
                        })
                        observer.observe( parent, { attributes: true, childList: true, characterData: true } )
                    //}
                    parent.insertBefore( child, parent.firstChild )
                }
            })
        }
        
        const appendDOM = ( child, parent, fn ) => {
            return new Promise( ( resolve, reject ) => {
                parent = parent || getParent( child )
                // if( isLightning()) {
                //     addOneTimeEventListener( parent, `DOMNodeInserted`, ()=>{
                //         if(fn){
                //             fn(child)
                //         }
                //         resolve( child )
                //     })
                // } else {
                      const observer = new MutationObserver( mutations => {
                      mutations.forEach( mutation => {
                        if ( mutation.type === `childList` && mutation.addedNodes.length > 0) {
                            if(fn){
                                fn(child)
                            }
                            observer.disconnect()
                            resolve( child )
                        }
                      })    
                    })
                    observer.observe( parent, { attributes: true, childList: true, characterData: true } )
                //}
                parent.appendChild( child )
            })
        }
            
        const isLightning = () => {
            return this.$A
        }

        const scrollTo = ( element, param, fn ) => {
            // more info here: https://coderwall.com/p/hujlhg/smooth-scrolling-without-jquery
            // http://stackoverflow.com/questions/4801655/how-to-go-to-a-specific-element-on-page
            element = element || $document.body
            let promise = undefined
            if ( !isUndefined( param.top ) ) {
                promise = smoothStep( element[ "scrollTop" ], param.top, param.duration || 400, ( value, percent ) => {
                    element[ "scrollTop" ] = value
                })
            }
            if ( !isUndefined( param.left ) ) {
                promise = smoothStep( element[ "scrollLeft" ], param.left, param.duration || 400, function( value, percent ) {
                    element[ "scrollLeft" ] = value;
                })
            }
            if ( fn ) {
                promise.then( fn )
            }
        }

        const smoothStep = ( current, target, duration, fn ) => {
            target = Math.round( target )
            duration = Math.round( duration )
            if ( duration < 0 ) {
                return Promise.reject( "bad duration" )
            }
            if ( duration === 0 ) {
                current = target
                return Promise.resolve()
            }
            let start_time = Date.now()
            let end_time = start_time + duration
            let start_top = current
            let distance = target - start_top
      
            // based on http://en.wikipedia.org/wiki/Smoothstep
            let smooth_step = ( start, end, point ) => {
                if ( point <= start ) { return 0 }
                if ( point >= end ) { return 1 }
                let x = ( point - start ) / ( end - start )
                return x * x * ( 3 - 2 * x )
            }
      
            return new Promise (( resolve, reject ) => {
                let previous_top = current
                let scroll_frame = () => {
                    if ( current != previous_top ) {
                        reject( "interrupted smoothStep" )
                        return
                    }
                    let now = Date.now()
                    let point = smooth_step( start_time, end_time, now )
                    let frameTop = Math.round( start_top + ( distance * point ) )
                    current = frameTop
                    if ( now >= end_time ) {
                        resolve( "finished smoothStep" )
                        return
                    }
                    if ( current === previous_top && current !== frameTop ) {
                        resolve()
                        return
                    }
                    previous_top = current

                    launch(()=>{
                        fn( previous_top, Math.round( point * 100 ) )
                    })

                    launch( scroll_frame, 0 )
                }
                launch( scroll_frame, 0 )
            })
        }

        const forceNavigateToURL = (  url, isredirect ) => {
            if( isUndefined( isredirect ) ) {
                isredirect = false
            }
            executeForceCommand( `navigateToURL`, { url: url,  isredirect: isredirect } )
        }

        const executeForceCommand = ( command, params ) => {
            // apollo11.executeForceCommand("showToast",{
            //     "title": "title",
            //     "message": "message",
            //     "type": "success",
            //     "mode": "dismissible"
            // });
            if( !$window.$A ) { return }
            launch($A.getCallback(() => {
                $window.$A.get( `e.force:${command}` ).setParams( params ).fire()
            }))
        }

        const executeAuraCommand = ( component, command, params ) => {
            return new Promise( ( resolve, reject ) => {
                let action = component.get( `c.${command}` )
                if( params ) {
                    action.setParams( params )
                }
                action.setCallback( this,  response => {
                    let state = response.getState()
                    if (component.isValid() && state === "SUCCESS") {
                        if(response.getReturnValue() !== null) {
                            resolve( response.getReturnValue() )
                        } else {
                            console.log( command + " command returned 0 results" )
                            reject( "empty query" )
                        }
                    } else {
                        console.log( command + " exception occured", "error" )
                        console.log( response.getError(), "error" )
                        reject( "exception occured" )
                    }
                })
                
                launch($A.getCallback(() => {
                    $window.$A.enqueueAction( action );
                }))
            });
        }

        const executeRemoteAction = ( controller, command, params ) => {
            return new Promise( ( resolve, reject ) => {
                $window.setTimeout(() => {
                    if( params ) {
                        $window[ controller ][ command ](
                            ...params,
                            ( result, event ) => {
                                if ( event.status ) {
                                    resolve( result );
                                    console.log( command + " : COMPLETED" )
                                } else if ( event.type === "exception" ) {
                                    reject( command +  " :Exception" )
                                    console.log( command +  " :Exception", "error" )
                                } else {
                                    console.log( command +  " :Unknown Error", "error" )
                                }
                            },
                            { escape: true }
                        );
                    } else {
                        $window[ controller ][ command ](
                            ( result, event ) => {
                                if ( event.status ) {
                                    resolve( result );
                                    console.log( command + " : COMPLETED" )
                                } else if ( event.type === "exception" ) {
                                    reject( command +  " :Exception" )
                                    console.log( command +  " :Exception", "error" )
                                } else {
                                    console.log( command +  " :Unknown Error", "error" )
                                }
                            },
                            { escape: true }
                        )
                    }
                },100)
            })
        }

        const arraysEqual = (arr1, arr2) => {
            if(arr1.length !== arr2.length)
                return false
            for(var i = arr1.length; i--;) {
                if(arr1[i] !== arr2[i])
                    return false
            }
            return true
        }

        const htmlTextToDOM = html => {
            let template = $document.createElement(`template`)
            template.innerHTML = html.trim()
            return template.content.firstChild
        }

        const appendHTMLText = ( html, loc, fn ) => {
            loc = loc || $document.body
            let DOM = htmlTextToDOM( html )
            //appendDOM( template, loc, (fn)?fn(template):undefined )
            return appendDOM( DOM, loc, fn )
        }
        
        const removeDOM = ( child, parent, fn ) => {
            parent = parent || getParent( child )
            if(!parent) {
                return;
            }
            //addOneTimeEventListener( parent, 'DOMNodeRemoved', fn );
            const observer = new MutationObserver( mutations => {
              mutations.forEach( mutation => {
                if ( mutation.type === `childList` && mutation.removedNodes.length > 0) {
                    if ( fn ) {
                        fn()
                        observer.disconnect()
                    }
                }
              })
            })
            observer.observe( parent, { attributes: true, childList: true, characterData: true } )
            parent.removeChild( child )
        }

        const getParent = ( elem, fn ) => {
            let _return
            const parent = elem.parentElement
            if ( !parent ) {
                return false
            }
            if ( isUndefined( fn ) ) {
               return parent
            }
            ( _parent => {
                _return = fn( _parent )
            })( parent )
            if ( !isUndefined( _return ) ) {
                return _return
            }
            return getParent( parent, fn )
        }

        const replaceAll = (target, search, replacement) => {
            return target.replace(new RegExp(search, 'g'), replacement)
        }

        const copyToClipboard = str => {
          const el = $document.createElement('textarea');  // Create a <textarea> element
          el.value = str;                                 // Set its value to the string that you want copied
          el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
          el.style.position = 'absolute';                 
          el.style.left = '-9999px';                      // Move outside the screen to make it invisible
          $document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
          const selected =            
            $document.getSelection().rangeCount > 0        // Check if there is any content selected previously
              ? $document.getSelection().getRangeAt(0)     // Store selection if found
              : false;                                    // Mark as false to know no selection existed before
          el.select();                                    // Select the <textarea> content
          $document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
          $document.body.removeChild(el);                  // Remove the <textarea> element
          if (selected) {                                 // If a selection existed before copying
            $document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
            $document.getSelection().addRange(selected);   // Restore the original selection
          }
        }

        const base64ToBlob = ( base64, contentType, sliceSize ) => {
            contentType = contentType || ``
            sliceSize = sliceSize || 512
            let byteCharacters = $window.atob( base64 )
            let byteArrays = []
            for ( let offset = 0; offset < byteCharacters.length; offset += sliceSize ) {
                const slice = byteCharacters.slice( offset, offset + sliceSize )
                let byteNumbers = new Array( slice.length )
                for ( let i = 0; i < slice.length; i++ ) {
                    byteNumbers[ i ] = slice.charCodeAt( i )
                }
                let byteArray = new Uint8Array( byteNumbers )
                byteArrays.push(byteArray)
            }
            return new Blob( byteArrays, { type: contentType } )
        }

        const base64ToObjectURL = ( base64, contentType ) => {
            return $window.URL.createObjectURL( base64ToBlob( base64, contentType ) )
        }
        
        const isOniFrame = () => {
            try {
                return $window.self !== $window.top
            } catch (e) {
                return true
            }
        }

        const dispatchEvent = (element, event, data) => {
            const evt = new CustomEvent( event, { bubbles: true, composed: true, detail: data } )
            evt.initEvent( event, true, false )
            element.dispatchEvent( evt )
        }

        const splice = ( parent, child, compareKey ) => {
            let pos = - 1
            forEvery(parent, (_child, i) => {
                if( compareKey ) {
                    if( child.hasOwnProperty(compareKey) &&  _child.hasOwnProperty(compareKey) ) {
                        if( child[ compareKey ] === _child[ compareKey ] ) {
                            pos = i
                            return false
                        }
                    }
                } else {
                    if( _child === child ) {
                        pos = i
                        return false
                    }
                }
            })
            if( pos > -1 ) {
                return parent.splice(pos, 1)
            }
        }


        //conditionFn() must return true inside
        const waitUntil = (conditionFn, interval = 30, until = 300) => {
            return new Promise( ( resolve, reject ) => {
                const timeout = new Date().getTime() + until
                let _value = false
                let timer = apollo11.pulsate(()=>{
                    if( (new Date().getTime()) > timeout ) {
                        clearInterval( timer )
                        reject(`Timeout`)
                        return
                    }
                    _value = conditionFn()
                    if( _value ) {
                        clearInterval( timer )
                        resolve( _value )
                        return
                    }
                }, interval)
            })
        }

        // description = {class:"classname"} {id:"idname"}
        const waitUntilDOMReady = ( description, parent = $document.body, timeoutseconds = 0.3) => {
            return new Promise( ( resolve, reject ) => {
                const timeout = new Date().getTime() + ( timeoutseconds * 1000 )
                let DOM
                const checkDOMReady = () => {
                    if( (new Date().getTime()) > timeout ) {
                        reject(`[WARNING] Timeout. DOM may not exists here.`)
                        console.log(description, parent)
                        return
                    }
                    forEveryKey( description, (value, key) => {
                        if( key === `id` ) {
                            parent = $document
                        }
                        DOM = getElement( value, key, parent )
                    })
                    if( DOM ) {
                        if( Object.prototype.toString.call( DOM ) === `[object HTMLElement]` ||
                            Object.prototype.toString.call( DOM ) === `[object HTMLDivElement]`) {
                            resolve( DOM )
                            return
                        } else if ( Object.prototype.toString.call( DOM ) === `[object HTMLCollection]` ) {
                            if( DOM.length > 0 ) {
                                resolve( DOM )
                                return
                            }
                        }
                    }
                    launch( checkDOMReady )
                }
                launch( checkDOMReady )
            })
        }

        const getDevice = () => {
            let orientation = 'UNKNOWN'
            let w = $window.innerWidth
            let h = $window.innerHeight
            if ($window.matchMedia('(orientation: portrait)').matches) {
               orientation = 'portrait'
            } else if ($window.matchMedia('(orientation: landscape)').matches) {
               orientation = 'landscape'
            }
            

            ////{type: "iPhoneXS", orientation: "portrait", width: 414, height: 896} 
            let device = 'UNKNOWN_DEVICE'
            if( isMobile() ) {
                if( w == 320 && h == 568 ) {
                    device = 'iPhoneSE'
                } else if( w == 375 && h == 667 ) {
                    device = 'iPhone6'
                } else if( w == 414 && h == 736 ) {
                    device = 'iPhone6P'
                } else if( w == 375 && h == 812 ) {
                    device = 'iPhoneX'
                } else if( w == 414 && h == 896 ) {
                    device = 'iPhoneXR'
                } else if( w == 1024 && h == 768 ) {
                    device = 'iPad'
                } else if( w == 1366 && h == 1024 ) {
                    device = 'iPadP'
                } else if( w == 1194 && h == 834 ) {
                    device = 'iPadP11'
                }
                //{type: "iPadP", orientation: "landscape", width: 1366, height: 1024}
                //{type: "iPadP", orientation: "landscape", width: 1194, height: 834} 
            } else {
                device = 'PC'
            }
            
            return {
                type        : device,
                orientation : orientation,
                width       : w,
                height      : h,
            }
        }

        const isMobile = () => {
            try {
                $document.createEvent("TouchEvent")
                return true;
            } catch (e) {}
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|AppleWebKit/i.test(navigator.userAgent)
        }

        const validateEmail =  email => {
            const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            return re.test( email )
        }

        const touchToMouseEvent = element => {
            var supportsPassive = false;
            try {
              var opts = Object.defineProperty({}, 'passive', {
                get: function() {
                  supportsPassive = true;
                }
              });
              $window.addEventListener("testPassive", null, opts);
              $window.removeEventListener("testPassive", null, opts);
            } catch (e) {}

            element.addEventListener("touchstart", _touchHandler, supportsPassive ? { passive: false } : false)
            element.addEventListener("touchmove", _touchHandler, supportsPassive ? { passive: false } : false)
            element.addEventListener("touchend", _touchHandler, supportsPassive ? { passive: false } : false)
        }

        const getURLParameter = name => {
            name = name.replace( /[\[]/ , "\\\[" ).replace( /[\]]/ , "\\\]" )
            let regex = new RegExp( "[\\?&]" + name + "=([^&#]*)" )
            let results = regex.exec( location.href )
            return results == null ? null : results[ 1 ]
        }

        const numberWithCommas = x => {
            let parts = x.toString().split( "." )
            parts[ 0 ] = parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, "," )
            return parts.join( "." )
        }
        
        /* camelCase => camel-case */
        const camelToSnakeCase = camelcase => {
            return camelcase.replace(/(?:^|\.?)([A-Z])/g, (x,y) => {return "-" + y.toLowerCase()}).replace(/^_/, "")
        }
        const _styleToCSSText = rule => {
            let _style = `${rule.selector} {`
            forEveryKey( rule.style, (value, key) =>{
                _style = `${_style} ${camelToSnakeCase(key)} : ${value};`
            })
            _style = `${_style} }`
            return _style
        }

        /**
            https://css-tricks.com/controlling-css-animations-transitions-javascript/
            https://www.raywenderlich.com/2389-top-5-ios-7-animations
            ********** insertCSSRule **********
            let matostyle = {
                type            : "text/css",
                selector        : ".matotest",
                style           : { color:"pink", fontSize:"40px" }
            }
            apollo11.insertCSSRule( matostyle )
            let matostyle2 = {
                cssText     : ".matotest2 { color : green; font-size: 35px; } .matotest3 { color : blue; font-size: 20px; }"
            }
            apollo11.insertCSSRule( matostyle2 )

            ********** upsertCSSRule **********
            let matostyle3 = {
                selector        : ".matotest3",
                style             : { color: "orange" }
            }
            apollo11.upsertCSSRule( matostyle3 )

            ********** getCSSRule **********
            let cssrule = apollo11.getCSSRule(".slds-context-bar")
            cssrule[0].style.backgroundColor = "#3f51b5 ";
            cssrule[0].style.color = "#FAFAFA"
        **/
        const upsertCSSRule = rule => {
            let _rules = getCSSRule( rule.selector )
            let _rule
            if( _rules.length > 0 ) {
                _rule = _rules[ _rules.length - 1 ]
                if( rule.style ) {
                    forEveryKey( rule.style, (value, key) => {
                        _rule["style"][key] = value
                    })
                } else {
                    rule.cssText = _styleToCSSText(rule)
                }
            } else {
                insertCSSRule( rule )
            }
        }
        const insertCSSRule = rule => {
            let head            = $document.getElementsByTagName( "head" )[0]
            let styleElement    = $document.createElement("style")
            styleElement.type   = rule.type || "text/css"
            styleElement.media  = rule.media || "screen"
            head.appendChild( styleElement )
            if( rule.cssText ) {
                styleElement.appendChild( $document.createTextNode(`${rule.cssText}`))
            } else {
                styleElement.appendChild( $document.createTextNode(`${_styleToCSSText(rule)}`))
            }
        }
        const getCSSRule = selector => {
            let rules = []
            forEvery( $document.styleSheets, style => {
                forEvery( style.cssRules, rule => {
                    if( rule.selectorText ) {
                        if( rule.selectorText === selector ) {
                            rules.push( rule ) 
                        }
                    } else {
                        forEvery( rule.cssRules , rule => {
                            if( rule.selectorText === selector ) {
                                rules.push( rule ) 
                            }
                        })
                    }
                })
            })
           return rules
        }

        const addOneTimeEventListener = ( element, eventname, fn ) => {
            if ( isUndefined( eventname ) || isUndefined( fn ) ) {
                return;
            }
            
            const _callback = event => {
                if ( element.removeEventListener ) {
                    element.removeEventListener( eventname, _callback )
                } else {
                    console.log("element cannot handle removeEventListener: " + eventname, "BUG")
                }
                //launch(()=>{fn( event )})
                fn( event )
            }
            element.addEventListener( eventname, _callback )
        }

        const onWindowResize = (fnstart, fnend) => {
            //winResizeStartFns
            _INTERNAL_DATA.winResizeStartFns.push( fnstart )
            _INTERNAL_DATA.winResizeEndFns.push( fnend )
        }
        
        const windowResize = fn =>  {
            forEvery( _INTERNAL_DATA.winResizeStartFns, _fn => {
                launch( _fn )
            })

            $window.clearTimeout( _INTERNAL_DATA.winResizeTimer )
            _INTERNAL_DATA.winResizeTimer = launch(()=>{
                forEvery( _INTERNAL_DATA.winResizeEndFns, _fn => {
                    launch( _fn )
                })
            },_INTERNAL_DATA.winResizeTimeout)
        }
        
        const onOrientationChange = fn => {
            _INTERNAL_DATA.orientFns.push( fn )
        }
        
        const orientationChange = fn => {
            const orientation = getDevice().orientation
            // if ( fn ) {
            //     launch(()=>{fn( orientation )})
                
            // }
            forEvery( _INTERNAL_DATA.orientFns, orientFn => {
                launch(()=>{orientFn( orientation )})
            })
        }
        /**
            * BELOW ARE INTERNAL FUNCTIONS USED INSIDE THE LIBRARY
            * THIS SHOULD NOT BE OVERWRITTEN
            */
        const _INTERNAL_DATA = {
            isInit: false,
            initFns: [],
            orientFns:[],
            winResizeStartFns: [],
            winResizeEndFns: [],
            winResizeTimer: 0,
            winResizeTimeout: 300,
            namespaceURI: {
                svg: `http://www.w3.org/2000/svg`,
                xlink: `http://www.w3.org/1999/xlink`,
                html: `http://www.w3.org/1999/xhtml`,
                xbl: `http://www.mozilla.org/xbl`,
                xul: `http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul`
            } 
        }

        const _initSystem = () => {
            try {
                $window.requestAnimationFrame = $window.requestAnimationFrame ||
                $window.webkitRequestAnimationFrame || 
                $window.msRequestAnimationFrame ||
                function( fx ) {return $window.setTimeout($A.getCallback(()=>{fx()}))}
            } catch( e ) {}
            addOneTimeEventListener( $document, `DOMContentLoaded`, _loadCompleted)
            addOneTimeEventListener( $window, `load`, _loadCompleted)
            $window.addEventListener( `resize` , windowResize)
            $window.addEventListener( "orientationchange" , orientationChange)  
            console.log('[INFO][INIT] apollo11.js')
        }
        
        const _loadCompleted = event =>  {
            launch(()=>{
                init(() => {
                    getElement('BODY','TAG')[0].classList.add( getDevice().type )
                    Object.preventExtensions( $window.apollo11 )
                    Object.seal( $window.apollo11 )
                })
            })
        }

        const chainPromises = promises => {
            let _result = []
            return new Promise( ( resolve, reject ) => {
                let pr = promises[0]
                forEvery( promises, (_promise, index ) => {
                    let nPromise = promises[ index + 1 ]
                    if( nPromise ) {
                        pr = pr.then( result => {
                            _result.push( result )
                            return nPromise
                        })
                    } else {
                        pr.then( result => {
                            _result.push( result )
                            resolve( _result )
                        }, error => {
                            reject( error )
                        })
                    }
                })
            })
        }

        const _isResourceExists = ( filename, filetype ) => {
            let targetelement = ( filetype === "js" ) ? "script" : ( filetype === "css" ) ? "link" : "none"
            let result
            let key
            if ( filetype === "js" ) {
                key = "src"
            } else if ( filetype === "css" ) {
                key = "href"
            }
            forEvery( getElement( targetelement, "TAG" ), value => {
                if ( value.getAttribute( key ) ) {
                    if ( value.getAttribute( key ) === filename ) {
                        result = value
                        return
                    }
                }
            })
            return result
        }

        const _insertJSONDOM = ( param, loc, ftype ) => {
            return new Promise( ( resolve, reject ) => {
                loc = loc || $document.body
                let _promises = []
                forEvery( param, data => {
                    _promises.push( JSONtoDOM( data ) )
                })
                Promise.all( _promises ).then( DOMS => {
                    let __promises = []
                    forEvery( DOMS, DOM => {
                        __promises.push( window.apollo11[ ftype ]( DOM, loc ) )
                    })
                    Promise.all( __promises ).then( __resolve => {
                        resolve( __resolve )
                    })
                })
            })
        }

        const _touchHandler = event => {
            let touches = event.changedTouches
            let first = touches[ 0 ]
            let type = ''
            
            switch( event.type ) {
                case 'touchstart': 
                    type = 'mousedown'
                    break
                case 'touchmove':
                    type = 'mousemove'
                    break
                case 'touchend':
                    type = 'mouseup'
                    break
                default:
                    return
            }

            const simulatedEvent = $document.createEvent( 'MouseEvent' )
            simulatedEvent.initMouseEvent( type, true, true, $window, 1, 
                                          first.screenX, first.screenY, 
                                          first.clientX, first.clientY, false, 
                                          false, false, false, 0, null )
            first.target.dispatchEvent( simulatedEvent )
            event.preventDefault( )
        }

        _initSystem()

        return {
            addOneTimeEventListener : addOneTimeEventListener,
            appendDOM               : appendDOM,
            appendHTMLText          : appendHTMLText,
            appendJSONDOM           : appendJSONDOM,
            arraysEqual             : arraysEqual,
            base64ToBlob            : base64ToBlob,
            base64ToObjectURL       : base64ToObjectURL,
            camelToSnakeCase        : camelToSnakeCase,
            copyToClipboard         : copyToClipboard,
            dispatchEvent           : dispatchEvent,
            executeAuraCommand      : executeAuraCommand,
            executeForceCommand     : executeForceCommand,
            executeRemoteAction     : executeRemoteAction,
            forceNavigateToURL      : forceNavigateToURL,
            forEvery                : forEvery,
            forEveryKey             : forEveryKey,
            getCSSRule              : getCSSRule,
            getDevice               : getDevice,
            getElement              : getElement,
            getNearestElement       : getNearestElement,
            getParent               : getParent,
            getURLParameter         : getURLParameter,
            htmlTextToDOM           : htmlTextToDOM,
            insertCSSRule           : insertCSSRule,
            isMobile                : isMobile,
            isUndefined             : isUndefined,
            isLightning             : isLightning,
            isOniFrame              : isOniFrame,
            JSONtoDOM               : JSONtoDOM,
            keygen                  : keygen,
            launch                  : launch,
            loadResource            : loadResource,
            mergeJSON               : mergeJSON,
            numberWithCommas        : numberWithCommas,
            onLaunch                : onLaunch,
            onOrientationChange     : onOrientationChange,
            onWindowResize          : onWindowResize,
            prependJSONDOM          : prependJSONDOM,
            prependDOM              : prependDOM,
            pulsate                 : pulsate,
            removeDOM               : removeDOM,
            replaceAll              : replaceAll,
            scrollTo                : scrollTo,
            splice                  : splice,
            silentlaunch            : silentlaunch,
            touchToMouseEvent       : touchToMouseEvent,
            upsertCSSRule           : upsertCSSRule,
            validateEmail           : validateEmail,
            waitUntil               : waitUntil,
            waitUntilDOMReady       : waitUntilDOMReady
        }

    })()

})( typeof window !== `undefined` ? window : this, document, typeof window !== `undefined` ? window.parent : this.parent )
