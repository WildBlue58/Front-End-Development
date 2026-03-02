import "dotenv/config";
import "cheerio"; // 后端 使用CSS选择器 像操作前端一样查找DOM节点
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

const cheerioLoader = new CheerioWebBaseLoader(
    "https://juejin.cn/post/7233327509919547452?searchId=20260302193603120AE3328025B138C1FB",
    {
        selector: "main-area p",
    },
);

const documents = await cheerioLoader.load();
console.log(documents);
