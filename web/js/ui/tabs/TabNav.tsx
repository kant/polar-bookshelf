import {TabNavs} from './TabNavs';

import * as React from 'react';
import Nav from 'reactstrap/lib/Nav';
import NavItem from 'reactstrap/lib/NavItem';
import NavLink from 'reactstrap/lib/NavLink';
import {ChannelCoupler} from '../../util/Channels';
import Button from 'reactstrap/lib/Button';
import {TabButtonContextMenu} from './TabButtonContextMenu';
import {TabPanes} from './TabPanes';
import {TabStyles} from './TabStyles';
import {Either} from '../../util/Either';
import {Tuples} from '../../util/Tuples';
import {IEntryContext} from '../../util/Tuples';
import {Arrays} from '../../util/Arrays';
import {OpenLinkWithNewTabMessage} from './TabNavs';
import {Logger} from '../../logger/Logger';

let tabSequence: number = 0;

const log = Logger.create();

// FIXME: add 'page-title-updated' event to webview.addEventListener

export class TabNav extends React.Component<IProps, IState> {

    constructor(props: IProps, context: any) {
        super(props, context);

        this.toggle = this.toggle.bind(this);
        this.addTab = this.addTab.bind(this);
        this.closeTab = this.closeTab.bind(this);
        this.closeOtherTabs = this.closeOtherTabs.bind(this);
        this.nextTab = this.nextTab.bind(this);
        this.prevTab = this.prevTab.bind(this);
        this.changeTab = this.changeTab.bind(this);

        this.onKeyDown = this.onKeyDown.bind(this);

        this.props.addTabBinder(tab => this.addTab(tab));

        const initialTabs = this.props.initialTabs || [] ;

        const tabs = initialTabs.map(current => {
            return {
                ...current,
                id: tabSequence++
            };
        });

        this.state = {
            activeTab: 0,
            tabs
        };

        const handleMessage = (event: MessageEvent) => {

            if (event.data.type === TabNavs.CHANNEL) {

                const message: OpenLinkWithNewTabMessage = event.data;

                const newTab: Tab = {
                    id: tabSequence++,
                    title: "No Title Yet",
                    content: message.link
                };

                const tabs = [...this.state.tabs, newTab];

                this.setState({...this.state, activeTab: newTab.id, tabs});

            }

        };

        window.addEventListener("message", event => {

            try {
                handleMessage(event);
            } catch (e) {
                log.error("Unable to handle message: ", e);
            }

        });

        window.addEventListener('keydown', event => this.onKeyDown(event));

    }

    private onKeyDown(event: KeyboardEvent) {

        // TODO we need jump to specific tab...
        // Jump to a specific tab	Ctrl + 1 through Ctrl + 8

        // Ctrl + w or Ctrl + F4

        if (event.code === 'KeyW' && event.ctrlKey) {
            this.closeTab(Either.ofLeft(event));
        }

        // FIXME: needs to be Apple not control on mac...
        if (event.code === 'PageDown' && event.ctrlKey) {
            this.nextTab();
        }

        if (event.code === 'PageUp' && event.ctrlKey) {
            this.prevTab();
        }

    }

    public render() {

        const NavTabs = () => {

            return <Nav style={TabStyles.TAB_NAV} tabs>

                {this.state.tabs.map(tab =>

                    <NavItem key={tab.id}>

                        <NavLink className={"p-0 " + (tab.id === this.state.activeTab ? "active" : "")}>

                            {/*TODO: this should be one component*/}
                            <div style={{display: 'flex'}}
                                 className={tab.id === this.state.activeTab ? "border-bottom border-primary " : ""}>

                                <div className="left-splitter"/>

                                <TabButtonContextMenu onCloseOtherTabs={() => this.closeOtherTabs(tab.id)}
                                                      onClose={() => this.closeTab(Either.ofRight(tab.id))}>

                                    <div className="mt-auto mb-auto pt-1 pb-1 pl-2 pr-1"
                                         style={{userSelect: 'none'}}
                                         onClick={() => this.toggle(tab.id)}>
                                        {tab.title}
                                    </div>

                                </TabButtonContextMenu>

                                <div className="mt-auto mb-auto mr-1">

                                    <Button color="link"
                                            onClick={() => this.closeTab(Either.ofRight(tab.id))}
                                            className="text-muted p-1"
                                            hidden={tab.required}
                                            style={{fontSize: '14px'}}>

                                        <i className="fas fa-times"></i>

                                    </Button>

                                </div>

                                <div className="right-splitter"/>

                            </div>

                        </NavLink>

                    </NavItem>

                   )}

            </Nav>;

        };

        return (

            <div className="browser-tabs"
                 onKeyDown={(event) => console.log(event)}>

                    <NavTabs/>

                    <TabPanes tabs={this.state.tabs}
                              activeTab={this.state.activeTab}
                              onTitleUpdated={(title, tab) => this.onTitleUpdated(title, tab)}/>

            </div>

        );

    }

    private addTab(tab: TabInit) {

        const newTab = {
            ...tab,
            id: tabSequence++
        };

        // make it the activeTab by default
        const activeTab = newTab.id;

        this.setState({
            ...this.state,
            tabs: [...this.state.tabs, newTab],
            activeTab
        });

    }

    private changeTab(dir: 'fwd' | 'rev') {

        interface TabOrder {
            first: Tab;
            next?: Tab;
        }

        interface TabIdx {
            readonly idx: number;
            readonly tab: Tab;
        }

        const computeTabIdx = (id: number, tabs: readonly Tab[]): TabIdx | undefined => {

            let idx: number = 0;
            for (; idx < tabs.length; ++idx) {

                const tab = tabs[idx];

                if (tab.id === id) {

                    return {idx, tab};

                }
            }

            return undefined;

        };

        const computeTabOrder = (activeTab: number, tabs: readonly Tab[]): TabOrder | undefined => {

            const tabIdx = computeTabIdx(activeTab, tabs);

            if ( ! tabIdx) {
                return undefined;
            }

            const first = tabs[0];
            const head = Arrays.head(tabs.slice(tabIdx.idx), 2);

            const next = head.length === 2 ? head[1] : undefined;

            return {first, next};

        };

        const tabs = dir === 'fwd' ? this.state.tabs : [...this.state.tabs].reverse();

        const tabOrder = computeTabOrder(this.state.activeTab, tabs);

        if (tabOrder) {

            const tab = tabOrder.next || tabOrder.first;

            this.setState({...this.state, activeTab: tab.id});

        }

    }

    private nextTab() {
        this.changeTab('fwd');
    }

    private prevTab() {
        this.changeTab('rev');
    }


    private closeTab(input: Either<KeyboardEvent, number>) {

        const event: KeyboardEvent | undefined = input.left;

        const nextActiveTab = (context: IEntryContext<Tab> | undefined): number | undefined => {

            if  (! context) {
                return undefined;
            }

            if (context.next) {
                return context.next.id;
            }

            if (context.prev) {
                return context.prev.id;
            }

            return undefined;

        };

        const closeTabByID = (id: number) => {

            const currentTab = Tuples.firstMatching(this.state.tabs, (tab: Tab) => tab.id === id);

            const activeTab = nextActiveTab(currentTab);

            const tabs = this.state.tabs.filter((tab: Tab) => tab.id !== id);

            if (event) {
                event.preventDefault();
            }

            if (activeTab) {
                this.setState({...this.state, tabs, activeTab});
            } else {
                // TODO: what now?
            }

        };

        if (input.hasLeft) {
            closeTabByID(this.state.activeTab);
        } else {
            const id = input.right;
            closeTabByID(id);
        }

    }

    private closeOtherTabs(tab: number) {

        const tabs = this.state.tabs.filter(current => current.id === tab || current.required);
        this.setState({...this.state, tabs, activeTab: tab});

    }

    private toggle(tab: number) {

        if (this.state.activeTab !== tab) {
            this.setState({...this.state, activeTab: tab});
        }

    }

    private onTitleUpdated(title: string, tab: Tab) {

        const newTab = {...tab, title};

        const tabs = Arrays.replace(this.state.tabs, newTab, (current) => current.id === newTab.id);

        this.setState({...this.state, tabs});

    }

}


interface IProps {

    readonly initialTabs?: ReadonlyArray<TabInit>;

    readonly addTabBinder: ChannelCoupler<TabInit>;
}

interface IState {
    readonly activeTab: number;
    readonly tabs: ReadonlyArray<Tab>;
}

export interface TabInit {

    /**
     * This tab is required for the UI to properly function and should not be
     * removed.
     */
    readonly required?: boolean;

    readonly title: string;

    /**
     * What we should be displaying in the tab.
     */
    readonly content: JSX.Element | string;

}

/**
 * Our high level interface for a tab
 */
export interface Tab extends TabInit {

    readonly id: number;

}

/**
 * Used to load content externally via a WebView but I need to figure out if
 * this is even doable but I think if I set the height as 100vh that it will
 * work properly.
 */
// class ExternalContent {
//
//     constructor(public readonly href: string) {
//
//     }
// }
//
