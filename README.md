こちらのソースはセキュリティーレビューに提出していないため、何か不具合、やトラブル発生した場合は責任負いかねますのであくまで参考としてご利用ください


このLWCは　messagingService　というWRAPPERコンポーネントを使用しています。以下はその使い方。



# MIAW API Wrapper for LWC

## 概要
MIAW のクライアントを自作するのが意外と面倒だったので、LWCからめちゃくちゃ簡単に作れるようにするライブラリを作成しました。
かつてないほどの抽象化により必要最低限の設定でチャット画面を作成できます。

## 使い方

1. force-app/main/default/lwc/messagingService をフォルダごと自分のプロジェクトの lwc フォルダにコピーする
2. 以下の要領で `import` して、通信を開始する。

```
import { LightningElement } from "lwc";

// ライブラリをインポート
import MessagingService from "c/messagingService";

export default class SampleUsage extends LightningElement {
    async connectedCallback() {

        // EventSoruce を初期化
        this.messagingService = new MessagingService(
          "storm-49cfb31fa2b3de.my.salesforce-scrt.com",
          "00DGC000005qRbY",
          "CustomEmbeddedServiceDeployment"
        );

        // イベント受診時のハンドラを設定
        await this.messagingService.startConversation({
            CONVERSATION_MESSAGE: ({ payload, sender }) => {
              console.log("CONVERSATION_MESSAGE", payload, sender);
            }
            // その他のイベントについては、force-app/main/default/lwc/sampleUsage/sampleUsage.js を参照
        });

        // メッセージを送信
        this.messagingService.sendMessage("Hello, World!");
    }
}
```

めっちゃ簡単。
Server Side Event といいながら、 EventSoruce はポリフィルが必須なの驚き！でもこれは、Web標準側がまだ完成していないかららしいよ！

## 参考
- [Messaging for In-App And Web API Endpoint Reference](https://developer.salesforce.com/docs/service/messaging-api/references/miaw-api-reference?meta=Summary)
