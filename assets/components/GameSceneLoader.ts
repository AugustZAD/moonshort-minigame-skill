import { _decorator, Component } from 'cc';
import { SceneParams } from '../scripts/core/SceneParams';
import { Navigator } from '../scripts/core/Navigator';

const { ccclass, property, menu, executionOrder } = _decorator;

/**
 * Game 场景加载器
 * 挂载到 game 场景根节点，启动时检测场景参数并执行相应逻辑
 * 
 * 使用场景：
 * 1. overviewWnd 无存档时 → 跳转 game 场景 + openAddPointWnd 参数 → 自动打开 addPointWnd
 * 2. 有存档时 → 跳转 game 场景 + saveId 参数 → 由 GameSceneController 处理
 */
@ccclass('GameSceneLoader')
@menu('Components/GameSceneLoader')
@executionOrder(-100) // 优先执行
export class GameSceneLoader extends Component {
    
    async start() {
        console.log('[GameSceneLoader] ========== game 场景已启动 ==========');
        
        // 获取场景参数（不消费）
        const params = SceneParams.get<{ 
            saveId?: number; 
            novelId?: string; 
            openAddPointWnd?: boolean 
        }>(false);
        
        console.log('[GameSceneLoader] 场景参数:', JSON.stringify(params, null, 2));
        
        // 如果需要打开 addPointWnd（无存档创建新存档流程）
        if (params.openAddPointWnd && params.novelId) {
            console.log('[GameSceneLoader] 检测到 openAddPointWnd，打开 addPointWnd');
            
            // 消费参数
            SceneParams.get(true);
            
            // 打开 addPointWnd
            await Navigator.toWnd('addPointWnd', { novelId: params.novelId });
            return;
        }
        
        // 其他情况交给 GameSceneController 处理（如果场景中有的话）
        console.log('[GameSceneLoader] 无需打开 addPointWnd，交给其他组件处理');
    }
}
