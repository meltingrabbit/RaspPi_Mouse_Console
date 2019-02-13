# RaspPi_Mouse_Console
Raspberry Pi Mouse / Cat を中継サーバー経由で遠隔操作するためのシステム

詳細
https://products.rt-net.jp/micromouse/archives/6859


## 内容
#### /src/pi_mouse
ロボット搭載ソフトウェア．
中継サーバーからの司令に従ってロボットを操作し，
またロボット側の情報を中継サーバーへ送信する．

#### /src/relay_server
中継サーバーのソフトウェア．
クライアント（PCのWebブラウザ）に対するWebサーバーとしも動作する．
操作コンソールをブラウザに表示させ，クライアントとロボットを対応づけし，
クライアント - ロボット間のコマンド・テレメトリをやり取りする．


