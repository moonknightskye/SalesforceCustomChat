import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader'; 
import apollo11src from '@salesforce/resourceUrl/apollo11_agentchat';
import MessagingService from "c/messagingService";

export default class LightningMIAWCustomClientChat extends LightningElement {

    
    isActive = false
    counter = 1
    AGENTDOM = undefined
    AGENT_NAME = 'Luna'
    CONVERSATION = []

    analyzeConversationVariables = []
    renderAnalyzeConversationFlow = false
    analyzeConversationFlowCallback = ()=>{}
    analyzeConversationPopup = false

    TRANSFER_TO_AGENT = `Please connect me to a representative now`
    transferToLiveChatVariables = []
    renderTransferToLiveChatFlow = false

    @api orgId
    @api apiName
    @api scrt2URL

    async initialize() {
        const VERSION = 1.4

        const lwcElement = apollo11.getElement( `.lightning-luna`, 'SELECT', this.template )
        const sendButton = apollo11.getElement( 'div.chat-text-button', 'SELECT', lwcElement)
        const textArea = apollo11.getElement('textarea.chat-text-input', 'SELECT', lwcElement)

        sendButton.addEventListener( 'click', evt => {
            this.send()
        })
        textArea.addEventListener( 'keydown', evt => {
            if( evt.keyCode == 13) {
                this.send()
            }
        })
        apollo11.launch(()=>{
            textArea.focus()
        }, 500)


        if(true){

        // EventSoruce を初期化
        this.messagingService = new MessagingService(
            this.scrt2URL,
            this.orgId,
            this.apiName,
            {
                _firstName: "John",
                _lastName: "Doe",
                _email: "jdoe@acme.com",
                _title: "Agenforce"
            }
        );

        // イベント受診時のハンドラを設定
        await this.messagingService.startConversation({
            CONVERSATION_MESSAGE: ({ payload, sender }) => {
                //console.log("CONVERSATION_MESSAGE", payload, sender);
                if( sender.role === 'EndUser' ) {
                    this.addText( 'me', payload.abstractMessage.staticContent.text )
                } else {
                    //this.addText( 'robot', payload.abstractMessage.staticContent.text )
                    if( this.AGENTDOM ) {
                        this.AGENTDOM.classList.remove( 'thinking' )
                        let chatTextEl = apollo11.getElement('.chat-text', 'SELECT', this.AGENTDOM)
                        chatTextEl.innerText = payload.abstractMessage.staticContent.text
                        this.AGENTDOM = undefined
                    }
                }
                this.CONVERSATION.push({[sender.role]:payload.abstractMessage.staticContent.text})

                if( !this.analyzeConversationPopup ) {
                    this.executeAnalyzeConversationFlow( result => {
                        console.log(`[INFO][CALLBACK] AnalyzeConversationFlow`, result)
                        if( result ) {
                            this.displayNotice()
                        }
                    })
                }

            },
            CONVERSATION_ROUTING_RESULT: ({ payload, sender }) => {
                console.log("CONVERSATION_ROUTING_RESULT", payload, sender);
            },
            CONVERSATION_ROUTING_WORK_RESULT: ({ payload, sender }) => {
                console.log("CONVERSATION_ROUTING_WORK_RESULT", payload, sender);
            },
            CONVERSATION_TYPING_STARTED_INDICATOR: ({ payload, sender }) => {
                //console.log("CONVERSATION_TYPING_STARTED_INDICATOR", payload, sender)

                if( sender.role !== 'EndUser' ) {
                    if( !(this.AGENTDOM && this.AGENTDOM.classList.contains( 'thinking' )) )  {
                        this.addText( 'robot', `...thinking`, DOM => {
                            this.AGENTDOM = DOM
                            this.AGENTDOM.classList.add( 'thinking' )
                        })
                    }
                }
            },
            CONVERSATION_PARTICIPANT_CHANGED: ({ payload, sender }) => {
                console.log("CONVERSATION_PARTICIPANT_CHANGED", payload, sender);
                this.AGENT_NAME = payload.entries[0].displayName
            },
            CONVERSATION_TYPING_STOPPED_INDICATOR: ({ payload, sender }) => {
                console.log("CONVERSATION_TYPING_STOPPED_INDICATOR", payload, sender);
            }
        });

        }

        console.log(`[INFO] MIAW Custom Client Chat ${VERSION}`)
    }

    send() {
        const lwcElement = apollo11.getElement( `.lightning-luna`, 'SELECT', this.template )
        const textArea = apollo11.getElement('textarea.chat-text-input', 'SELECT', lwcElement)

        let message = textArea.value.trim()
        if( message[message.length - 1] === '\n' ) {
            message = message.substring(0, message.length - 1)
        }
        if( message.length > 0 ) {
            apollo11.launch(()=>{
                textArea.value = ''
            })
            // メッセージを送信
            this.messagingService.sendMessage( message )
        }
    }

    addText(type, message, callback=(DOM)=>{}) {
        const lwcElement = apollo11.getElement( `.lightning-luna`, 'SELECT', this.template )
        const chatItemList = apollo11.getElement('ul.chat-item-list', 'SELECT', lwcElement)
        let CHATNAME = ''

        let doma = {tag:'SPAN'}
        let domb = {tag:'SPAN'}
        if( type == 'me' ) {
            doma = {tag:'DIV', class:'spacer', 'c-lunachatgpt_lunachatgpt':''}
            CHATNAME = 'You'
        } else {
            domb = {tag:'DIV', class:'spacer', 'c-lunachatgpt_lunachatgpt':''}
            CHATNAME = this.AGENT_NAME
        }
        this.counter = this.counter + 1
        let JSONDOM = {tag:'LI', 'c-lunachatgpt_lunachatgpt':'', class:`chat-item ${type}`, data:{chatId:this.counter}, children:[
            doma,
            {tag:'DIV', class:'chat-bubble', 'c-lunachatgpt_lunachatgpt':'', children:[
                {tag:'DIV', class:'chat-text', 'c-lunachatgpt_lunachatgpt':'', children:[
                    {tag:'DIV', 'c-lunachatgpt_lunachatgpt':'', class:'spot-holder', children:[
                        {tag:'DIV', 'c-lunachatgpt_lunachatgpt':'', class:'spot'},
                        {tag:'DIV', 'c-lunachatgpt_lunachatgpt':'', class:'spot'},
                        {tag:'DIV', 'c-lunachatgpt_lunachatgpt':'', class:'spot'}
                    ]}
                ]},
                {tag:'DIV', class:'chat-name', 'c-lunachatgpt_lunachatgpt':'', text:CHATNAME}
            ]},
            domb
        ]}
        apollo11.appendJSONDOM( JSONDOM, chatItemList, DOM => {
            if( message != '...thinking' ) {
                let chatTextEl = apollo11.getElement('.chat-text', 'SELECT', DOM)
                chatTextEl.innerHTML = message
            }
            callback( DOM )

            apollo11.launch(()=>{
                DOM.scrollIntoView()
            }, 150) 
        } )
    }

    executeAnalyzeConversationFlow( callback=(result)=>{} ) {
        let strConversation = JSON.stringify({conversation:this.CONVERSATION})
        console.log(`[INFO][EXECUTE] AnalyzeConversationFlow`, this.CONVERSATION, strConversation.length)

        this.analyzeConversationVariables = [
            {
                name: 'conversation',
                type: 'String',
                value: strConversation
            }
        ];
            
            //Once set to true the flow will run
        this.renderAnalyzeConversationFlow = true;
        this.analyzeConversationFlowCallback = callback;
    }

    executeTransferToLiveChatFlow( ) {
        this.messagingService.sendMessage( this.TRANSFER_TO_AGENT )
        // this.transferToLiveChatVariables = [
        //     {
        //         name: 'conversationId',
        //         type: 'String',
        //         value: this.messagingService.conversationId
        //     }
        // ];
            
        // //Once set to true the flow will run
        // this.renderTransferToLiveChatFlow = true;
    }

    analyzeConversationStatusChange(event) {
        //console.log('[INFO][FINISH] AnalyzeConversationFlow', event)
        if (event.detail.status === 'FINISHED_SCREEN') {
            this.renderAnalyzeConversationFlow = false;
            this.analyzeConversationFlowCallback( event.detail.outputVariables[0].value )
        } else {
            console.log('[INFO][ERROR] AnalyzeConversationFlow execution encountered an unexpected status.')
        }
    }

    displayNotice() {
        this.analyzeConversationPopup = true
        const DOMSTRING = `
        <li class="chat-item menu">
            <div class="notice-holder">
                <div class="notice">
                    <div class="title">Do you want to talk to a representative?</div>
                    <div class="message">It seems like the AI bot is not doing its job. Would you like us to transfer you to a representative instead?</div>
                    <div class="button-menu">
                        <ul class="flex-box flex-col">
                            <li>
                                <div class="button yes">Yes</div>
                            </li>
                            <li>
                                <div class="button no">No</div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </li>
        `
        const lwcElement = apollo11.getElement( `.lightning-luna`, 'SELECT', this.template )
        const chatItemList = apollo11.getElement('ul.chat-item-list', 'SELECT', lwcElement)
        apollo11.appendJSONDOM( {tag:'LI', class:'chat-item menu'}, chatItemList, DOM => {
            DOM.innerHTML = DOMSTRING

            apollo11.launch(()=>{
                const menuEl = apollo11.getElement('.menu', 'SELECT', lwcElement)
                const yesEl = apollo11.getElement('.yes', 'SELECT', menuEl)
                const noEl = apollo11.getElement('.no', 'SELECT', menuEl)

                yesEl.addEventListener('click', evt => {
                    menuEl.classList.add('hide')
                    //this.addText( 'robot', `Please wait while we are transferring you to a representative...`, DOM => {})
                    this.executeTransferToLiveChatFlow()
                })
                noEl.addEventListener('click', evt => {
                    menuEl.classList.add('hide')
                })

                DOM.scrollIntoView()
            }, 150)
        })
    }

    transferToLiveChatStatusChange(event) {
        if (event.detail.status === 'FINISHED_SCREEN') {
            this.renderTransferToLiveChatFlow = false;
            console.log('[INFO] transferToLiveChatFlow successfully ran')
        } else {
            console.log('Flow execution encountered an unexpected status.');
        }
    }

    renderedCallback( ) {
        if( this.isActive ) { return }
        this.isActive = true

        Promise.all([
            loadScript( this, apollo11src )
        ]).then(() => {
            this.initialize()
        })
    }

    disconnectedCallback() {
        this.isActive = false
    }

    isValid() {
        return this.isActive
    }
}