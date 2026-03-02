import { _decorator, Component, Node, Label, Sprite, Prefab, instantiate, assetManager, ImageAsset, SpriteFrame, Texture2D, Button } from 'cc';
import { ClickRouterTo } from './ClickRouterTo';
import { showLoading, hideLoading } from '../scripts/utils/SpriteLoading';
import { SceneParams } from '../scripts/core/SceneParams';
import { Navigator } from '../scripts/core/Navigator';
import { GameManager } from '../scripts/core/GameManager';
import { NovelsAPI } from '../scripts/api/NovelsAPI';
import { SavesAPI } from '../scripts/api/SavesAPI';
import { Novel, SaveGame } from '../scripts/types/api.types';
import { trackOverviewPlayClick, trackOverviewView } from '../analytics/UiEvents';
import { TagItemComponent } from './TagItemComponent';

const { ccclass, property, menu } = _decorator;

/**
 * 小说详情页组件
 * 显示小说名称、描述、标签、点赞数、游玩次数、章节数量等
 * 支持点赞/取消点赞功能
 */
@ccclass('NovelOverviewComponent')
@menu('Components/NovelOverviewComponent')
export class NovelOverviewComponent extends Component {
    // UI 元素
    @property({ type: Sprite, tooltip: '封面图' })
    coverImage: Sprite | null = null;

    @property({ type: Label, tooltip: '小说标题' })
    titleLabel: Label | null = null;

    @property({ type: Label, tooltip: '小说描述' })
    descriptionLabel: Label | null = null;

    @property({ type: Label, tooltip: '点赞数量' })
    likeCountLabel: Label | null = null;

    @property({ type: Label, tooltip: '游玩次数' })
    viewCountLabel: Label | null = null;

    @property({ type: Label, tooltip: '章节数量' })
    nodeCountLabel: Label | null = null;

    @property({ type: Button, tooltip: '点赞按钮' })
    likeButton: Button | null = null;

    @property({ type: Node, tooltip: '已点赞状态节点（点赞后显示）' })
    likedNode: Node | null = null;

    @property({ type: Node, tooltip: '未点赞状态节点（默认显示）' })
    unlikedNode: Node | null = null;

    // 标签相关
    @property({ type: Node, tooltip: '标签容器节点' })
    tagsContainer: Node | null = null;

    @property({ type: Prefab, tooltip: '标签项预制体（需包含 TagItemComponent）' })
    tagPrefab: Prefab | null = null;

    // 加载状态
    @property({ type: Node, tooltip: '加载中提示节点' })
    loadingNode: Node | null = null;

    @property({ type: Node, tooltip: '错误提示节点' })
    errorNode: Node | null = null;

    @property({ type: Node, tooltip: '内容节点（加载成功后显示）' })
    contentNode: Node | null = null;

    @property({ tooltip: '属性分配场景名称' })
    addPointSceneName: string = 'add-point';

    private novelId: string = '';
    private novelsAPI: NovelsAPI | null = null;
    private savesAPI: SavesAPI | null = null;
    private currentNovel: Novel | null = null;
    private isLiking: boolean = false; // 防止重复点击

    onLoad() {
        // 初始化 API
        const gameManager = GameManager.getInstance();
        this.novelsAPI = new NovelsAPI(gameManager.getAPI());
        this.savesAPI = new SavesAPI(gameManager.getAPI());

        // 自动发现 UI 节点（prefab 中可能未配置引用）
        this.autoDiscoverUI();

        // 获取场景参数
        const params = SceneParams.get<{ novelId: string }>();
        
        if (!params.novelId) {
            console.error('[NovelOverviewComponent] 缺少 novelId 参数');
            this.showError();
            return;
        }

        this.novelId = params.novelId;
        console.log('[NovelOverviewComponent] 接收到 novelId:', this.novelId);

        // 绑定点赞按钮事件（先 off 防止重复绑定）
        if (this.likeButton) {
            this.likeButton.node.off(Button.EventType.CLICK, this.onLikeButtonClick, this);
            this.likeButton.node.on(Button.EventType.CLICK, this.onLikeButtonClick, this);
        }

        // 加载小说详情
        this.loadNovelDetail();
    }

    /**
     * 自动发现 UI 节点
     * 当 prefab 中的 @property 引用未配置时，通过节点名称自动查找
     */
    private autoDiscoverUI() {
        // 找到 main 节点（父节点）
        const mainNode = this.node.parent;
        if (!mainNode) {
            console.warn('[NovelOverviewComponent] 找不到父节点');
            return;
        }

        // 查找 helper：递归搜索第一个指定名称的子节点
        const findChild = (root: Node, name: string): Node | null => {
            for (const child of root.children) {
                if (child.name === name) return child;
                const found = findChild(child, name);
                if (found) return found;
            }
            return null;
        };

        // 标题 Label
        if (!this.titleLabel) {
            const titleNode = findChild(mainNode, 'title');
            if (titleNode) {
                this.titleLabel = titleNode.getComponent(Label);
            }
        }

        // 描述 Label（Introduction 节点）
        if (!this.descriptionLabel) {
            const introNode = findChild(mainNode, 'Introduction');
            if (introNode) {
                this.descriptionLabel = introNode.getComponent(Label);
            }
        }

        // 点赞数 Label（detail > btns > like > number）
        if (!this.likeCountLabel) {
            const detailNode = findChild(mainNode, 'detail');
            if (detailNode) {
                const statBtns = detailNode.getChildByName('btns');
                const likeNode = statBtns?.getChildByName('like');
                const likeNumber = likeNode?.getChildByName('number');
                if (likeNumber) {
                    this.likeCountLabel = likeNumber.getComponent(Label);
                }
            }
        }

        // 游玩次数 Label（detail > btns > play > number）
        if (!this.viewCountLabel) {
            const detailNode = findChild(mainNode, 'detail');
            if (detailNode) {
                const statBtns = detailNode.getChildByName('btns');
                const playNode = statBtns?.getChildByName('play');
                const playNumber = playNode?.getChildByName('number');
                if (playNumber) {
                    this.viewCountLabel = playNumber.getComponent(Label);
                }
            }
        }

        // 章节数 Label（detail > btns > chapters > number）
        if (!this.nodeCountLabel) {
            const detailNode = findChild(mainNode, 'detail');
            if (detailNode) {
                const statBtns = detailNode.getChildByName('btns');
                const chaptersNode = statBtns?.getChildByName('chapters');
                // prefab 中这里拼写为 nember，兼容两种名称
                const chaptersNumber = chaptersNode?.getChildByName('number') || chaptersNode?.getChildByName('nember');
                if (chaptersNumber) {
                    this.nodeCountLabel = chaptersNumber.getComponent(Label);
                }
            }
        }

        // 标签容器（detail > Tags）
        if (!this.tagsContainer) {
            const tagsNode = findChild(mainNode, 'Tags');
            if (tagsNode) {
                this.tagsContainer = tagsNode;
            }
        }

        // 封面图 Sprite（temp-5 > SpriteSplash）
        if (!this.coverImage) {
            const splashNode = findChild(mainNode, 'SpriteSplash');
            if (splashNode) {
                this.coverImage = splashNode.getComponent(Sprite);
            }
        }

        // 播放按钮（main 直接子节点 btns > btn-play）
        const bottomBtns = mainNode.getChildByName('btns');
        if (bottomBtns) {
            const btnPlayNode = bottomBtns.getChildByName('btn-play');
            if (btnPlayNode) {
                // 禁用 prefab 上的 ClickRouterTo，避免与脚本逻辑冲突（它会通过 TOUCH_END 抢先跳转场景）
                const clickRouter = btnPlayNode.getComponent(ClickRouterTo);
                if (clickRouter) {
                    clickRouter.enabled = false;
                }

                const btnPlay = btnPlayNode.getComponent(Button);
                if (btnPlay) {
                    // 清理 prefab 中 target 为 null 的无效事件，重新绑定
                    btnPlay.clickEvents = [];
                    btnPlay.node.on(Button.EventType.CLICK, this.onClickRouterToGame, this);
                }
            }

            // 点赞按钮（底部 btn-like，即第二个子节点）
            if (!this.likeButton && bottomBtns.children.length > 1) {
                const likeBtnNode = bottomBtns.children[1];
                const likeBtn = likeBtnNode.getComponent(Button);
                if (likeBtn) {
                    this.likeButton = likeBtn;
                    // 清理 clickEvents，统一用脚本绑定
                    likeBtn.clickEvents = [];
                }

                // 发现 icon-like-1（未点赞）和 icon-like-2（已点赞）节点
                if (!this.unlikedNode) {
                    const iconLike1 = likeBtnNode.getChildByName('icon-like-1');
                    if (iconLike1) {
                        this.unlikedNode = iconLike1;
                    }
                }
                if (!this.likedNode) {
                    const iconLike2 = likeBtnNode.getChildByName('icon-like-2');
                    if (iconLike2) {
                        this.likedNode = iconLike2;
                    }
                }
            }
        }

        console.log('[NovelOverviewComponent] UI 自动发现结果:', {
            titleLabel: !!this.titleLabel,
            descriptionLabel: !!this.descriptionLabel,
            likeCountLabel: !!this.likeCountLabel,
            viewCountLabel: !!this.viewCountLabel,
            nodeCountLabel: !!this.nodeCountLabel,
            coverImage: !!this.coverImage,
            tagsContainer: !!this.tagsContainer,
            likeButton: !!this.likeButton,
            likedNode: !!this.likedNode,
            unlikedNode: !!this.unlikedNode,
        });
    }

    /**
     * 跳转到游戏场景（如果已有存档）
     */
    private navigateToGame(saveId: string) {
        console.log('[NovelOverviewComponent] 跳转到游戏场景, saveId:', saveId);
        
        // 设置场景参数
        SceneParams.set({ 
            saveId: parseInt(saveId),
            novelId: this.novelId 
        });
        
        console.log('[NovelOverviewComponent] SceneParams 已设置:', { saveId: parseInt(saveId), novelId: this.novelId });
        
        // 跳转场景
        Navigator.toScene('game');
    }
    
    /**
     * 跳转到属性分配场景（创建新存档）
     * 跳转到 game 场景，带上 openAddPointWnd 参数，由 GameSceneLoader 处理
     */
    private navigateToAddPoint() {
        console.log('[NovelOverviewComponent] 跳转到 game 场景并打开属性分配窗口');
        Navigator.toScene('game', { 
            novelId: this.novelId, 
            openAddPointWnd: true 
        });
    }

    /**
     * 加载小说详情
     */
    private async loadNovelDetail() {
        if (!this.novelsAPI) {
            return;
        }

        this.showLoading();

        try {
            const novel = await this.novelsAPI.getDetail(this.novelId);
            this.currentNovel = novel;
            this.renderNovelDetail(novel);
            trackOverviewView(novel.id, novel.title);
            this.showContent();
        } catch (error) {
            console.error('[NovelOverviewComponent] 加载小说详情失败:', error);
            this.showError();
        }
    }

    /**
     * 渲染小说详情
     */
    private renderNovelDetail(novel: Novel) {
        console.log('[NovelOverviewComponent] 渲染小说详情:', novel);

        // 封面图
        if (novel.coverImage) {
            this.loadCoverImage(novel.coverImage);
        }

        // 标题
        if (this.titleLabel) {
            this.titleLabel.string = novel.title;
        }

        // 描述
        if (this.descriptionLabel) {
            this.descriptionLabel.string = novel.description || '暂无描述';
        }

        // 点赞数
        if (this.likeCountLabel) {
            this.likeCountLabel.string = novel.likeCount.toString();
        }

        // 游玩次数
        if (this.viewCountLabel) {
            this.viewCountLabel.string = novel.viewCount.toString();
        }

        // 章节数量
        if (this.nodeCountLabel) {
            this.nodeCountLabel.string = `${novel.nodeCount} chapters`;
        }

        // 渲染标签
        this.renderTags(novel.tags || []);

        // 更新点赞按钮状态
        this.updateLikeButtonState(novel.isLiked || false);
    }

    /**
     * 加载封面图
     */
    private async loadCoverImage(url: string) {
        if (!this.coverImage) {
            return;
        }

        try {
            // 显示 Loading
            const coverNode = this.coverImage.node;
            if (coverNode) showLoading(coverNode);
            
            // 加载远程图片
            assetManager.loadRemote<ImageAsset>(url, { ext: '.png' }, (err, imageAsset) => {
                // 隐藏 Loading
                if (coverNode) hideLoading(coverNode);
                
                if (err) {
                    console.error('[NovelOverviewComponent] 加载封面图失败:', err);
                    return;
                }

                if (!this.coverImage) {
                    return;
                }

                // 创建纹理
                const texture = new Texture2D();
                texture.image = imageAsset;

                // 创建 SpriteFrame
                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;

                // 设置到 Sprite
                this.coverImage.spriteFrame = spriteFrame;
            });
        } catch (error) {
            console.error('[NovelOverviewComponent] 加载封面图异常:', error);
        }
    }

    /**
     * 渲染标签列表
     */
    private renderTags(tags: string[]) {
        if (!this.tagsContainer || !this.tagPrefab) {
            return;
        }

        // 清空容器
        this.tagsContainer.removeAllChildren();

        // 创建标签项
        for (const tag of tags) {
            const tagNode = instantiate(this.tagPrefab);
            this.tagsContainer.addChild(tagNode);

            // 设置标签文本
            const tagComponent = tagNode.getComponent(TagItemComponent);
            if (tagComponent) {
                tagComponent.setTag(tag);
            } else {
                // 降级：直接查找 Label
                const label = tagNode.getComponent(Label) || tagNode.getComponentInChildren(Label);
                if (label) {
                    label.string = tag;
                }
            }
        }
    }

    /**
     * 点赞按钮点击事件
     */
    private async onLikeButtonClick() {
        if (!this.currentNovel || !this.novelsAPI || this.isLiking) {
            return;
        }

        this.isLiking = true;
        const wasLiked = this.currentNovel.isLiked || false;

        try {
            if (wasLiked) {
                // 取消点赞
                await this.novelsAPI.unlike(this.novelId);
                this.currentNovel.isLiked = false;
                this.currentNovel.likeCount--;
            } else {
                // 点赞
                await this.novelsAPI.like(this.novelId);
                this.currentNovel.isLiked = true;
                this.currentNovel.likeCount++;
            }

            // 更新 UI
            this.updateLikeButtonState(this.currentNovel.isLiked);
            if (this.likeCountLabel) {
                this.likeCountLabel.string = this.currentNovel.likeCount.toString();
            }

        } catch (error) {
            console.error('[NovelOverviewComponent] 点赞/取消点赞失败:', error);
            // 恢复状态
            this.currentNovel.isLiked = wasLiked;
        } finally {
            this.isLiking = false;
        }
    }

    /**
     * 更新点赞按钮状态
     */
    private updateLikeButtonState(isLiked: boolean) {
        // 根据点赞状态显示/隐藏对应节点
        if (this.likedNode) {
            this.likedNode.active = isLiked;
        }
        
        if (this.unlikedNode) {
            this.unlikedNode.active = !isLiked;
        }
    }

    /**
     * 显示加载状态
     */
    private showLoading() {
        if (this.loadingNode) this.loadingNode.active = true;
        if (this.errorNode) this.errorNode.active = false;
        if (this.contentNode) this.contentNode.active = false;
    }

    /**
     * 显示错误状态
     */
    private showError() {
        if (this.loadingNode) this.loadingNode.active = false;
        if (this.errorNode) this.errorNode.active = true;
        if (this.contentNode) this.contentNode.active = false;
    }

    /**
     * 显示内容
     */
    private showContent() {
        if (this.loadingNode) this.loadingNode.active = false;
        if (this.errorNode) this.errorNode.active = false;
        if (this.contentNode) this.contentNode.active = true;
    }

    /**
     * 获取当前小说 ID
     */
    getNovelId(): string {
        return this.novelId;
    }

    /**
     * 获取当前小说数据
     */
    getCurrentNovel(): Novel | null {
        return this.currentNovel;
    }

    /**
     * 点击按钮跳转到游戏场景
     * 可以在编辑器中将按钮的点击事件绑定到这个方法
     * 
     * 使用方式：
     * 1. 在按钮的 Button 组件中，点击 "Click Events" 的 "+"
     * 2. 将 NovelOverviewComponent 所在节点拖入
     * 3. 选择 NovelOverviewComponent -> onClickRouterToGame
     */
    async onClickRouterToGame() {
        console.log('[NovelOverviewComponent] 按钮点击：跳转到游戏');

        const title = this.currentNovel?.title || this.titleLabel?.string || undefined;
        trackOverviewPlayClick(this.novelId, title);

        // 检查登录状态
        const gameManager = GameManager.getInstance();
        if (!gameManager.isLoggedIn()) {
            console.warn('[NovelOverviewComponent] 用户未登录，跳转到 login');
            Navigator.toScene('login');
            return;
        }
        
        // 获取该小说的第一个存档或创建新存档
        if (!this.savesAPI) {
            console.error('[NovelOverviewComponent] savesAPI 未初始化');
            return;
        }
        
        try {
            console.log('[NovelOverviewComponent] 正在获取存档列表...');
            const saves = await this.savesAPI.getList(this.novelId);
            console.log('[NovelOverviewComponent] 存档列表:', saves);
            
            if (saves && saves.length > 0) {
                // 有存档，直接进入游戏
                console.log('[NovelOverviewComponent] 使用第一个存档:', saves[0].id);
                this.navigateToGame(saves[0].id);
            } else {
                // 没有存档，跳转到属性分配页面
                console.log('[NovelOverviewComponent] 没有存档，跳转到属性分配页面');
                this.navigateToAddPoint();
            }
        } catch (error: any) {
            console.error('[NovelOverviewComponent] 获取存档失败:', error);
            // 认证失败时跳转 login
            if (error?.statusCode === 401 || error?.code === 'UNAUTHORIZED') {
                console.warn('[NovelOverviewComponent] 认证过期，跳转到 login');
                Navigator.toScene('login');
            }
        }
    }

    onDestroy() {
        // 清理事件监听（检查节点是否有效）
        if (this.likeButton && this.likeButton.node && this.likeButton.node.isValid) {
            this.likeButton.node.off(Button.EventType.CLICK, this.onLikeButtonClick, this);
        }
        
        // 清空引用
        this.novelsAPI = null;
        this.savesAPI = null;
        this.currentNovel = null;
    }
}
