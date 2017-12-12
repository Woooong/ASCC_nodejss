var express = require('express');
var crypto = require('crypto');
var bodyParser = require('body-parser');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '13.124.5.168',
    user     : 'root',
    password : 'rPtjdgurdldnfkagjdnd123',
    database : 'ascc'
});
connection.connect();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('admin/login');
});

router.post('/login', function(req,res,next){
   res.json({"code" : 200})
});
//TODO login 후 교수님 세션 가져오기
router.get('/index', function(req, res, next) {
    connection.query('SELECT * from class_info', function (error, results, fields) {
        if (error)
            res.json("error");

        console.log(results);
        res.render('admin/index',{classes: results});
    });

});

router.get('/class/:id', function(req, res, next) {
    var id = req.params.id;
    connection.query('select * from student_info, ci_si_relation, class_info where si_type="student" and csr_ci_id="'+ id +'" and csr_si_id= si_id and ci_id="'+id+'";', function (error, results, fields) {
        if (error)
            res.json("error");

        console.log(results[0]);
        for(var i=0; i<results.length; i++){
            results[i].attendance = Math.floor(Math.random() * (40 - 35 + 1)) + 35;
            results[i].absence = 40-results[i].attendance;
            results[i].breakaway = Math.floor((Math.random() * 10) + 1);
            results[i].attpoints = (10 - (results[i].absence * 0.5 + results[i].breakaway * 0.3)).toFixed(1);

        }

        res.render('admin/class',{studnets: results});
    });

});

router.get('/class/:ci_code/:si_num', function(req, res, next) {
    var ci_code = req.params.ci_code;
    var si_num = req.params.si_num;
    connection.query('select * from attendance \n' +
        'where si_num = "'+si_num+'"\n' +
        'and ci_code = "'+ci_code+'"', function (error, results, fields) {
        if (error)
            res.json("error");
        //개강일 -> 20170901
        console.log(results);
        var str_date = new Date("2017-09-01");

        //종강일 -> 20171222
        var end_date = new Date("2017-12-22");

        //수업 요일 및 강의실
        // var ci_week = "Mon 10:30~12:00 Pal 410,Mon 13:00~15:00 Pal 333 Pal 318,Thur 10:30~12:00 Pal 410";
        var ci_week = "Tue 21:00~23:00 Pal 333,Thur 13:00~18:00 Pal Hall";

        ci_week = ci_week.split(',');
        for(var i = 0; i<ci_week.length; i++){
            ci_week[i] = ci_week[i].split(' ');
        }
        //날짜계산
        var date_arr = [];
        var i = 0;
        var cnt = 0;
        while(1){
            if(i==0){
                for(var j = 0; j<ci_week.length; j++){
                    if(ci_week[j][0] == str_date.format("E")){
                        if(ci_week[j][0] == str_date.format("E")){
                            date_arr[cnt] = str_date.format("yyyy-MM-dd")+" "+ ci_week[j][1] +" "+ ci_week[j][2] +""+ ci_week[j][3];
                            date_arr[cnt] = date_arr[cnt].split(" ");
                            date_arr[cnt][3] = 0;
                            date_arr[cnt][4] = 0;
                            cnt++;
                        }
                    }
                }

            }else{
                var dayOfMonth = str_date.getDate();
                str_date.setDate(dayOfMonth + 1);
                for(var j = 0; j<ci_week.length; j++){
                    if(ci_week[j][0] == str_date.format("E")){
                        date_arr[cnt] = str_date.format("yyyy-MM-dd")+" "+ ci_week[j][1] +" "+ ci_week[j][2] +""+ ci_week[j][3];
                        date_arr[cnt] = date_arr[cnt].split(" ");
                        date_arr[cnt][3] = 0;
                        date_arr[cnt][4] = 0;
                        cnt++;
                    }
                }

                if(str_date.toString() === end_date.toString()){
                    break;
                }
            }
            i++;
        }
        var attendance;
        for(var i=0; i<2; i++){
            var str_time = date_arr[i][1].split('~')[0];
            var end_time = date_arr[i][1].split('~')[1];
            console.log("str_time :" +str_time);
            console.log("end_time :" +end_time);
            for(var j=0; j<results.length; j++){
                results[j].created_at = results[j].created_at.setHours(dt.getHours() + 9);

                if(date_arr[i][0] == results[j].created_at.format('yyyy-MM-dd')){
                    if(str_time < results[j].created_at.format('HH:mm') && end_time > results[j].created_at.format('HH:mm')){
                        date_arr[i][3]++;
                        if(date_arr[i][4] == 0)
                            date_arr[i][4] = results[j].created_at.format('yyyy-MM-dd HH:mm');
                    }
                }
            }
        }
         console.log(date_arr);

        res.render('admin/student',{attendance: results, date_arr: date_arr});
    });

});

Date.prototype.format = function(f) {
    if (!this.valueOf()) return " ";

    var weekName = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
    var d = this;

    return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
        switch ($1) {
            case "yyyy": return d.getFullYear();
            case "yy": return (d.getFullYear() % 1000).zf(2);
            case "MM": return (d.getMonth() + 1).zf(2);
            case "dd": return d.getDate().zf(2);
            case "E": return weekName[d.getDay()];
            case "HH": return d.getHours().zf(2);
            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
            case "mm": return d.getMinutes().zf(2);
            case "ss": return d.getSeconds().zf(2);
            case "a/p": return d.getHours() < 12 ? "오전" : "오후";
            default: return $1;
        }
    });
};

String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};

module.exports = router;

