import * as React from 'react';
import {Tab} from './TabNav';
import TabContent from 'reactstrap/lib/TabContent';
import TabPane from 'reactstrap/lib/TabPane';
import {TabBody} from './TabBody';

export class TabPanes extends React.Component<IProps, IState> {

    constructor(props: IProps, context: any) {
        super(props, context);
    }

    public render() {

        return <TabContent activeTab={this.props.activeTab}>

            {this.props.tabs.map(tab => {

                    return <TabPane tabId={tab.id} key={tab.id}>

                        <TabBody tab={tab}
                                 onTitleUpdated={title => this.props.onTitleUpdated(title, tab)}/>

                    </TabPane>;

                })

            }

        </TabContent>;

    }

}


interface IProps {
    readonly activeTab: number;
    readonly tabs: ReadonlyArray<Tab>;
    readonly onTitleUpdated: (title: string, tab: Tab) => void;

}

interface IState {
}


