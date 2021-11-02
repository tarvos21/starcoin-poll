import React, { PureComponent } from 'react';
import { withTranslation } from 'react-i18next';
import i18n from 'i18next';
import Helmet from 'react-helmet';
import { createStyles, Theme, withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import CardHeader from '@material-ui/core/CardHeader';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import CenteredView from '@/common/View/CenteredView';
import { POLL_STATUS } from '@/utils/constants';
import client from '@/utils/client';
import { getNetwork } from '@/utils/helper';
import { LoadingOutlined } from '@ant-design/icons';
import ConnectWallet from '@/Polls/components/ConnectWallet/adapter';
import PollDialog from '@/Polls/components/PollDialog';
import PollCard from './PollCard';
// import DynamicForm from '../DynamicForm';

const useStyles = (theme: Theme) =>
  createStyles({
    pagerArea: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'flex-end',
    },

    component: {
      marginTop: '30px',
    },

    header: {
      marginBottom: '20px',
    },

    title: {
      color: 'white',
      fontSize: '16px',
    },

    wrapper: {
      position: 'relative',
      i: {
        position: 'absolute',
        top: '50%',
        right: '6px',
        transform: 'translate(0, -50%)',
        pointerEvents: 'none',
      },
    },

    select: {
      appearance: 'none',
      border: '1px solid $slate',
      borderRadius: '3px',
      fontSize: '12px',
      padding: '6px 10px',
      paddingRight: '32px',
      textTransform: 'capitalize',
    },

    dim: {
      opacity: '0.5',
    },
    [theme.breakpoints.down('xs')]: {
      gridCards: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridGap: `${theme.spacing(1) * 2}px ${theme.spacing(1) * 2}px`,
        padding: theme.spacing(1) * 2,
      },
    },
    [theme.breakpoints.up('sm')]: {
      gridCards: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridGap: `${theme.spacing(1) * 2}px ${theme.spacing(1) * 2}px`,
        padding: theme.spacing(1) * 2,
      },
    },
    [theme.breakpoints.up('lg')]: {
      gridCards: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridGap: `${theme.spacing(1) * 2}px ${theme.spacing(1) * 2}px`,
        padding: theme.spacing(1) * 2,
      },
    },
  });

interface ExternalProps {
  className?: string;
}

interface InternalProps {
  pollList: any;
  isLoadingMore: boolean;
  getPollList: (contents: any, callback?: any) => any;
  classes: any;
  t: any;
  match: any;
}

interface Props extends ExternalProps, InternalProps { }

interface IndexState {
  filter: string;
  status: number;
  hideVoted: boolean;
  open: boolean;
  list: Record<string, any>[];
  page: number;
  loading: boolean;
  totalPage: number;
  accounts: Array<any>;
}

const isLocal = window.location.host.includes('localhost');

class List extends PureComponent<Props, IndexState> {
  // eslint-disable-next-line react/static-property-placement
  static defaultProps = {
    pollList: null,
    isLoadingMore: undefined,
    getPollList: () => { },
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      filter: '',
      status: 0,
      hideVoted: false,
      open: false,
      loading: true,
      page: 1,
      list: [],
      totalPage: 1,
      accounts: [],
    };
  }

  componentDidMount() {
    this.fetchList(parseInt(this.props.match.params.page, 10) || 1);
  }

  fetchList = async (page = 1) => {
    let { list } = this.state;
    if (page === 1) {
      list = [];
    }
    this.setState({
      loading: true,
    });
    try {
      const resp = await client.get(
        `polls/page/${getNetwork()}?page=${page}&count=20`,
      );
      const newlist = list.concat(resp.list);
      const totalPage = resp.totalPage;
      this.setState({
        list: newlist,
        totalPage,
        page,
      });
    } catch (e) {
      console.error(e);
    } finally {
      this.setState({ loading: false });
    }
  };

  setFilter = (value: string) => {
    this.setState({ filter: value });
  };

  render() {
    const { t, classes } = this.props;
    const suffix = i18n.language === 'en' ? 'En' : '';
    const {
      hideVoted,
      status,
      open,
      list,
      loading,
      page,
      totalPage,
      accounts,
    } = this.state;

    const menus = [{ label: t('poll.all'), value: 0 }];
    for (let i = 1; i < 8; i++) {
      menus.push({
        label: t(`poll.statusText.${i}`),
        value: i,
      });
    }

    let renderList = list.concat() || [];
    if (hideVoted) {
      renderList = renderList.filter(
        (l: any) => l.status !== POLL_STATUS.EXTRACTED,
      );
    }
    if (status) {
      renderList = renderList.filter((l: any) => l.status === status);
    }
    const loadingProps = loading
      ? {
        disabled: true,
        startIcon: <LoadingOutlined />,
      }
      : {};

    console.log('accounts: ', accounts);
    return (
      <div>
        <Helmet>
          <title>{t('header.polls')}</title>
        </Helmet>

        <PollDialog
          open={open}
          defaultCreator={accounts[0]}
          onClose={() => {
            this.setState({
              open: false,
            });
          }}
          afterSubmit={async () => {
            await this.fetchList();
          }}
        />

        <CenteredView>
          <Card>
            <CardHeader
              action={
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={hideVoted}
                          color="primary"
                          onChange={() => {
                            this.setState((prevState) => ({
                              hideVoted: !prevState.hideVoted,
                            }));
                          }}
                        />
                      }
                      label={t('poll.hideVoted')}
                    />
                  </Grid>
                  <Grid item>
                    <Select
                      style={{ width: 120 }}
                      value={status}
                      onChange={(
                        event: React.ChangeEvent<{ value: unknown }>,
                      ) => {
                        this.setState({
                          status: event.target.value as number,
                        });
                      }}
                    >
                      {menus.map(({ label, value }) => (
                        <MenuItem value={value} key={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                </Grid>
              }
              title={
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <Typography>{t('header.polls')}</Typography>
                  </Grid>
                  {isLocal && (
                    <Grid item>
                      {accounts.length ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => {
                            this.setState({
                              open: true,
                            });
                          }}
                        >
                          {t('poll.create')}
                        </Button>
                      ) : (
                        <ConnectWallet
                          onAccountChange={(accounts: Array<any>) => {
                            this.setState({
                              accounts,
                            });
                          }}
                        />
                      )}
                    </Grid>
                  )}
                </Grid>
              }
            />
            <Divider />
            <div className={classes.gridCards}>
              {renderList.length
                ? renderList.map((poll: any, index: number) => (
                  <PollCard
                    key={`key_${index}`}
                    id={poll.id}
                    url={`/polls/detail/${poll.id}`}
                    link={poll.link}
                    title={poll[`title${suffix}`]}
                    for_votes={poll.forVotes}
                    against_votes={poll.againstVotes}
                    status={poll.status}
                    end_time={poll.endTime}
                    creator={poll.creator}
                    type_args_1={poll.typeArgs1}
                  />
                ))
                : t('poll.NoPoll')}
            </div>
            {page < totalPage ? (
              <div style={{ padding: 16 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => this.fetchList(page + 1)}
                  {...loadingProps}
                >
                  View More
                </Button>
              </div>
            ) : null}
          </Card>
        </CenteredView>
      </div>
    );
  }
}

export default withStyles(useStyles)(withTranslation()(List));
