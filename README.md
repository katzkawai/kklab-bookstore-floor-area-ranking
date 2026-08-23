# 日本の書店 面積ランキング

日本の大型書店を**売場面積**で比較し、グラフ化したサイトです。

公開URL: <https://katzkawai.org/kklab-bookstore-floor-area-ranking/>
（<https://katzkawai.github.io/kklab-bookstore-floor-area-ranking/> からも公開されます）

複合店の総売場と、書籍コーナーだけの面積では順位が変わります。初期表示は総売場、切り替えで書籍売場（内訳が分かる店）を表示します。

愛知・岐阜・三重・静岡は、地方書店を含めた別ページがあります。

- 全国: <https://katzkawai.org/kklab-bookstore-floor-area-ranking/>
- 東海4県: <https://katzkawai.org/kklab-bookstore-floor-area-ranking/tokai.html>

## ローカルで見る

ビルドは不要です。リポジトリのルートで HTTP サーバーを起動してください。

```bash
python3 -m http.server 8000
```

その後、<http://localhost:8000> を開きます。

## ファイル構成

```text
.
├── index.html              # 全国ランキング
├── tokai.html              # 東海4県（地方書店を含む）
├── styles.css
├── app.js                  # フィルタ・Chart.js・背表紙表示
├── data/bookstores.json    # 全国データ
├── data/tokai.json         # 愛知・岐阜・三重・静岡
└── .github/workflows/
    └── deploy-pages.yml    # GitHub Pages への自動公開
```

## データの見方

- 換算は 1坪 = 3.305785㎡
- **総売場**: 各店の公表売り場面積。文具・カフェ等を含む複合店がある
- **書籍売場**: 内訳が公表されている場合のみ。不明な複合店は除外
- 梅田店・福岡店など、フロア縮小や移転後に公式面積が更新されていない店は、開店時などの公表値に注記を付けて掲載
- 全国全店の網羅リストではない。公表値または二次資料がある大型店を収録

## 主な出典

店舗ごとの URL は `data/bookstores.json` にあります。概要:

- 各店公式案内、開店時プレス、honto 店舗情報
- [ジュンク堂書店 - Wikipedia](https://ja.wikipedia.org/wiki/%E3%82%B8%E3%83%A5%E3%83%B3%E3%82%AF%E5%A0%82%E6%9B%B8%E5%BA%97)
- [コーチャンフォー - Wikipedia](https://ja.wikipedia.org/wiki/%E3%82%B3%E3%83%BC%E3%83%81%E3%83%A3%E3%83%B3%E3%83%95%E3%82%A9%E3%83%BC)
- [紀伊國屋書店 新宿本店](https://www.kinokuniya.co.jp/contents/pc/store/Shinjuku-Main-Store/shopinfo.html)
- 琉球新報（那覇店増床）、東洋経済オンライン（コーチャンフォー）
- [JAPAN WANDERER 全国大型店ランキング](https://japan-wanderer.com/bookstore-japan/)（二次集計の補完）

最終確認日: 2026-08-24

## 免責事項

面積は公表値や二次資料に基づく概数であり、正確性・完全性・最新性は保証しません。本サイトは Grok で作成されており、誤りを含む可能性があります。指摘は [Issues](https://github.com/katzkawai/kklab-bookstore-floor-area-ranking/issues) へお願いします。

## 制作

本サイト（コード・コンテンツ）は **Grok**（xAI）で作成しました。

## ライセンス

サイトのコードは [MIT License](./LICENSE) で公開します。各出典の権利はそれぞれの権利者に帰属します。
