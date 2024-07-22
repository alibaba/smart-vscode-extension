import ApiExecuteData from "../Apis/ApiExecuteData";
import CommandApis from "../Apis/CommandApis";
import { MetadataCategoryEnum } from "../Common/enum";
import BaseMetadata from "./BaseMetadata";


export default class CommandMetadata extends BaseMetadata {
    constructor() {
        super(MetadataCategoryEnum.command, "command");
    }


    protected async getData(): Promise<Object> {
        const commandApis = new CommandApis();
        const apiExecuteData: ApiExecuteData = await commandApis.listCommandsWithCategory();
        return { commands: JSON.parse(apiExecuteData.toModelMsg) };
    }

}