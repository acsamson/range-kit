/**
 * Mock selection data for demo purposes
 * Note: These are based on the Chinese article "出师表"
 * The DOM paths may need to be adjusted for different page structures
 */

export interface MockSelection {
  id: string
  text: string
  type: string
  restore: {
    anchors: {
      startId: string
      endId: string
      startOffset: number
      endOffset: number
      startCustomId: string | null
      endCustomId: string | null
    }
    paths: {
      startPath: string
      endPath: string
      startOffset: number
      endOffset: number
      startTextOffset: number
      endTextOffset: number
    }
    multipleAnchors: {
      startAnchors: {
        tagName: string
        className: string
        id: string
        attributes: Record<string, string>
      }
      endAnchors: {
        tagName: string
        className: string
        id: string
        attributes: Record<string, string>
      }
      commonParent: string
      siblingInfo: {
        index: number
        total: number
        tagPattern: string
      }
    }
    fingerprint: {
      tagName: string
      className: string
      attributes: Record<string, string>
      textLength: number
      childCount: number
      depth: number
      parentChain: Array<{
        tagName: string
        className: string
        id: string
      }>
      siblingPattern: {
        position: number
        total: number
        beforeTags: string[]
        afterTags: string[]
      }
    }
    context: {
      precedingText: string
      followingText: string
      parentText: string
      textPosition: {
        start: number
        end: number
        totalLength: number
      }
    }
  }
}

/**
 * Get mock selections for Vue demo
 * These selections are specifically structured for the Vue demo page layout
 */
export function getVueDemoMockSelections(): MockSelection[] {
  return [
    {
        "id": "sel_1765105497930_4tc60wwva",
        "text": "今天下三分，益州疲弊",
        "restore": {
            "anchors": {
                "startId": "demo-content",
                "endId": "demo-content",
                "startOffset": 28,
                "endOffset": 38,
                "startCustomId": null,
                "endCustomId": null
            },
            "paths": {
                "startPath": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(1)",
                "endPath": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(1)",
                "startOffset": 12,
                "endOffset": 22,
                "startTextOffset": 12,
                "endTextOffset": 22
            },
            "multipleAnchors": {
                "startAnchors": {
                    "tagName": "p",
                    "className": "",
                    "id": "",
                    "attributes": {}
                },
                "endAnchors": {
                    "tagName": "p",
                    "className": "",
                    "id": "",
                    "attributes": {}
                },
                "commonParent": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(1)",
                "siblingInfo": {
                    "index": 2,
                    "total": 11,
                    "tagPattern": "p"
                }
            },
            "fingerprint": {
                "tagName": "p",
                "className": "",
                "attributes": {},
                "textLength": 110,
                "childCount": 0,
                "depth": 8,
                "parentChain": [
                    {
                        "tagName": "p",
                        "className": "",
                        "id": ""
                    },
                    {
                        "tagName": "article",
                        "className": "article-content",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "demo-content",
                        "id": "demo-content"
                    },
                    {
                        "tagName": "main",
                        "className": "main-content",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "layout-container",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "vue-demo",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "",
                        "id": "app"
                    },
                    {
                        "tagName": "body",
                        "className": "",
                        "id": ""
                    }
                ],
                "siblingPattern": {
                    "position": 2,
                    "total": 11,
                    "beforeTags": [
                        "h1",
                        "h3"
                    ],
                    "afterTags": [
                        "p",
                        "p"
                    ]
                }
            },
            "context": {
                "precedingText": "先帝创业未半而中道崩殂，",
                "followingText": "，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开",
                "parentText": "先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。",
                "textPosition": {
                    "start": 12,
                    "end": 22,
                    "totalLength": 110
                }
            }
        },
        "type": "important"
    },
    {
        "id": "sel_1765105505230_tt0wfl74m",
        "text": "殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，",
        "restore": {
            "anchors": {
                "startId": "demo-content",
                "endId": "demo-content",
                "startOffset": 26,
                "endOffset": 69,
                "startCustomId": null,
                "endCustomId": null
            },
            "paths": {
                "startPath": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(1)",
                "endPath": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(1)",
                "startOffset": 10,
                "endOffset": 53,
                "startTextOffset": 10,
                "endTextOffset": 53
            },
            "multipleAnchors": {
                "startAnchors": {
                    "tagName": "p",
                    "className": "",
                    "id": "",
                    "attributes": {}
                },
                "endAnchors": {
                    "tagName": "p",
                    "className": "",
                    "id": "",
                    "attributes": {}
                },
                "commonParent": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(1)",
                "siblingInfo": {
                    "index": 2,
                    "total": 11,
                    "tagPattern": "p"
                }
            },
            "fingerprint": {
                "tagName": "p",
                "className": "",
                "attributes": {},
                "textLength": 110,
                "childCount": 0,
                "depth": 8,
                "parentChain": [
                    {
                        "tagName": "p",
                        "className": "",
                        "id": ""
                    },
                    {
                        "tagName": "article",
                        "className": "article-content",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "demo-content",
                        "id": "demo-content"
                    },
                    {
                        "tagName": "main",
                        "className": "main-content",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "layout-container",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "vue-demo",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "",
                        "id": "app"
                    },
                    {
                        "tagName": "body",
                        "className": "",
                        "id": ""
                    }
                ],
                "siblingPattern": {
                    "position": 2,
                    "total": 11,
                    "beforeTags": [
                        "h1",
                        "h3"
                    ],
                    "afterTags": [
                        "p",
                        "p"
                    ]
                }
            },
            "context": {
                "precedingText": "先帝创业未半而中道崩",
                "followingText": "盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以",
                "parentText": "先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。",
                "textPosition": {
                    "start": 10,
                    "end": 53,
                    "totalLength": 110
                }
            }
        },
        "type": "question"
    },
    {
        "id": "sel_1765105510363_1b8uq0itk",
        "text": "道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不",
        "restore": {
            "anchors": {
                "startId": "demo-content",
                "endId": "demo-content",
                "startOffset": 24,
                "endOffset": 107,
                "startCustomId": null,
                "endCustomId": null
            },
            "paths": {
                "startPath": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(1)",
                "endPath": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(1)",
                "startOffset": 8,
                "endOffset": 91,
                "startTextOffset": 8,
                "endTextOffset": 91
            },
            "multipleAnchors": {
                "startAnchors": {
                    "tagName": "p",
                    "className": "",
                    "id": "",
                    "attributes": {}
                },
                "endAnchors": {
                    "tagName": "p",
                    "className": "",
                    "id": "",
                    "attributes": {}
                },
                "commonParent": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(1)",
                "siblingInfo": {
                    "index": 2,
                    "total": 11,
                    "tagPattern": "p"
                }
            },
            "fingerprint": {
                "tagName": "p",
                "className": "",
                "attributes": {},
                "textLength": 110,
                "childCount": 0,
                "depth": 8,
                "parentChain": [
                    {
                        "tagName": "p",
                        "className": "",
                        "id": ""
                    },
                    {
                        "tagName": "article",
                        "className": "article-content",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "demo-content",
                        "id": "demo-content"
                    },
                    {
                        "tagName": "main",
                        "className": "main-content",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "layout-container",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "vue-demo",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "",
                        "id": "app"
                    },
                    {
                        "tagName": "body",
                        "className": "",
                        "id": ""
                    }
                ],
                "siblingPattern": {
                    "position": 2,
                    "total": 11,
                    "beforeTags": [
                        "h1",
                        "h3"
                    ],
                    "afterTags": [
                        "p",
                        "p"
                    ]
                }
            },
            "context": {
                "precedingText": "先帝创业未半而中",
                "followingText": "宜妄自菲薄，引喻失义，以塞忠谏之路也。",
                "parentText": "先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。",
                "textPosition": {
                    "start": 8,
                    "end": 91,
                    "totalLength": 110
                }
            }
        },
        "type": "bookmark"
    },
    {
        "id": "sel_1765105515246_1zicis88z",
        "text": "中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。\n  宫中府中，俱为一体，陟",
        "restore": {
            "anchors": {
                "startId": "demo-content",
                "endId": "demo-content",
                "startOffset": 23,
                "endOffset": 140,
                "startCustomId": null,
                "endCustomId": null
            },
            "paths": {
                "startPath": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(1)",
                "endPath": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(2)",
                "startOffset": 7,
                "endOffset": 11,
                "startTextOffset": 7,
                "endTextOffset": 11
            },
            "multipleAnchors": {
                "startAnchors": {
                    "tagName": "p",
                    "className": "",
                    "id": "",
                    "attributes": {}
                },
                "endAnchors": {
                    "tagName": "p",
                    "className": "",
                    "id": "",
                    "attributes": {}
                },
                "commonParent": "div#demo-content > article.article-content:nth-of-type(1)",
                "siblingInfo": {
                    "index": 2,
                    "total": 11,
                    "tagPattern": "p,p"
                }
            },
            "fingerprint": {
                "tagName": "p",
                "className": "",
                "attributes": {},
                "textLength": 110,
                "childCount": 0,
                "depth": 8,
                "parentChain": [
                    {
                        "tagName": "p",
                        "className": "",
                        "id": ""
                    },
                    {
                        "tagName": "article",
                        "className": "article-content",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "demo-content",
                        "id": "demo-content"
                    },
                    {
                        "tagName": "main",
                        "className": "main-content",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "layout-container",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "vue-demo",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "",
                        "id": "app"
                    },
                    {
                        "tagName": "body",
                        "className": "",
                        "id": ""
                    }
                ],
                "siblingPattern": {
                    "position": 2,
                    "total": 11,
                    "beforeTags": [
                        "h1",
                        "h3"
                    ],
                    "afterTags": [
                        "p",
                        "p"
                    ]
                }
            },
            "context": {
                "precedingText": "先帝创业未半而",
                "followingText": "罚臧否，不宜异同。若有作奸犯科及为忠善者，宜付有司论其刑赏，以昭陛下平明之理，不宜偏私，使内外异法也",
                "parentText": "先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。",
                "textPosition": {
                    "start": -1,
                    "end": 116,
                    "totalLength": 110
                }
            }
        },
        "type": "note"
    },
    {
        "id": "sel_1765105520179_viaiy7fcf",
        "text": "而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。\n  宫中府中，俱为一体，陟罚臧否，不宜异同。若有作奸犯科及为忠善者，宜付有司论其刑赏，以昭陛下平明之理",
        "restore": {
            "anchors": {
                "startId": "demo-content",
                "endId": "demo-content",
                "startOffset": 22,
                "endOffset": 178,
                "startCustomId": null,
                "endCustomId": null
            },
            "paths": {
                "startPath": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(1)",
                "endPath": "div#demo-content > article.article-content:nth-of-type(1) > p:nth-of-type(2)",
                "startOffset": 6,
                "endOffset": 49,
                "startTextOffset": 6,
                "endTextOffset": 49
            },
            "multipleAnchors": {
                "startAnchors": {
                    "tagName": "p",
                    "className": "",
                    "id": "",
                    "attributes": {}
                },
                "endAnchors": {
                    "tagName": "p",
                    "className": "",
                    "id": "",
                    "attributes": {}
                },
                "commonParent": "div#demo-content > article.article-content:nth-of-type(1)",
                "siblingInfo": {
                    "index": 2,
                    "total": 11,
                    "tagPattern": "p,p"
                }
            },
            "fingerprint": {
                "tagName": "p",
                "className": "",
                "attributes": {},
                "textLength": 110,
                "childCount": 0,
                "depth": 8,
                "parentChain": [
                    {
                        "tagName": "p",
                        "className": "",
                        "id": ""
                    },
                    {
                        "tagName": "article",
                        "className": "article-content",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "demo-content",
                        "id": "demo-content"
                    },
                    {
                        "tagName": "main",
                        "className": "main-content",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "layout-container",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "vue-demo",
                        "id": ""
                    },
                    {
                        "tagName": "div",
                        "className": "",
                        "id": "app"
                    },
                    {
                        "tagName": "body",
                        "className": "",
                        "id": ""
                    }
                ],
                "siblingPattern": {
                    "position": 2,
                    "total": 11,
                    "beforeTags": [
                        "h1",
                        "h3"
                    ],
                    "afterTags": [
                        "p",
                        "p"
                    ]
                }
            },
            "context": {
                "precedingText": "先帝创业未半",
                "followingText": "，不宜偏私，使内外异法也。",
                "parentText": "先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。",
                "textPosition": {
                    "start": -1,
                    "end": 155,
                    "totalLength": 110
                }
            }
        },
        "type": "warning"
    }
]
}
